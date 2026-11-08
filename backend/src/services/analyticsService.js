const db = require('../DATABASE/mysql');

// 1. Initialize or refresh session
const initOrUpdateSessionInDB = async ({
    sessionId,
    visitorUuid,
    userId = null,
    deviceType = 'desktop',
    browser = 'Unknown',
    os = 'Unknown',
    ipAddress = null,
    referrer = '',
    landingPage = '/'
}) => {
    try {
        const query = `
            INSERT INTO visitor_sessions 
                (session_id, visitor_uuid, user_id, device_type, browser, os, ip_address, referrer, landing_page, is_active, last_active_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                user_id = COALESCE(?, user_id),
                is_active = 1,
                last_active_at = NOW()
        `;
        await db.execute(query, [
            sessionId, visitorUuid, userId, deviceType, browser, os, ipAddress, referrer, landingPage,
            userId
        ]);

        if (userId && visitorUuid) {
            await db.execute(
                `UPDATE visitor_sessions SET user_id = ? WHERE visitor_uuid = ? AND user_id IS NULL`,
                [userId, visitorUuid]
            );
        }
        return { sessionId };
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] initOrUpdateSession error:', err.message);
        throw err;
    }
};

// 2. Record new page view
const recordPageViewInDB = async ({ sessionId, pagePath, pageTitle = '', productId = null }) => {
    try {
        const query = `
            INSERT INTO page_views (session_id, page_path, page_title, product_id, entered_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        const [result] = await db.execute(query, [sessionId, pagePath, pageTitle, productId]);
        return result.insertId;
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] recordPageView error:', err.message);
        throw err;
    }
};

// 3. Heartbeat: Safe time increment (Never crashes with NULL values)
const processHeartbeatInDB = async ({ sessionId, visitorUuid, userId = null, viewId = null, incrementSec = 25 }) => {
    try {
        if (!sessionId) return;

        await db.execute(
            `UPDATE visitor_sessions 
             SET total_duration_sec = COALESCE(total_duration_sec, 0) + ?, 
                 user_id = COALESCE(?, user_id),
                 last_active_at = NOW(), 
                 is_active = 1 
             WHERE session_id = ?`,
            [incrementSec, userId || null, sessionId]
        );

        if (userId && visitorUuid) {
            await db.execute(
                `UPDATE visitor_sessions SET user_id = ? WHERE visitor_uuid = ? AND user_id IS NULL`,
                [userId, visitorUuid]
            );
        }

        if (viewId) {
            await db.execute(
                `UPDATE page_views 
                 SET time_spent_sec = COALESCE(time_spent_sec, 0) + ?,
                     exited_at = NOW()
                 WHERE view_id = ?`,
                [incrementSec, viewId]
            );
        }
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] processHeartbeat error:', err.message);
    }
};

// 4. Mark session inactive on exit
const markSessionExitInDB = async ({ sessionId, viewId = null, finalPageTimeSec = 0 }) => {
    try {
        await db.execute(
            `UPDATE visitor_sessions 
             SET is_active = 0, last_active_at = NOW() 
             WHERE session_id = ?`,
            [sessionId]
        );

        if (viewId && finalPageTimeSec > 0) {
            await db.execute(
                `UPDATE page_views 
                 SET time_spent_sec = COALESCE(time_spent_sec, 0) + ?, exited_at = NOW() 
                 WHERE view_id = ?`,
                [finalPageTimeSec, viewId]
            );
        }
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] markSessionExit error:', err.message);
    }
};

// 5. Log custom high-intent actions
const recordAnalyticsEventInDB = async ({ sessionId, eventName, eventCategory = 'engagement', metadata = {} }) => {
    try {
        const query = `
            INSERT INTO analytics_events (session_id, event_name, event_category, metadata)
            VALUES (?, ?, ?, ?)
        `;
        await db.execute(query, [sessionId, eventName, eventCategory, JSON.stringify(metadata)]);
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] recordEvent error:', err.message);
    }
};

// 6. Admin Dashboard Live Stats (100% MySQL Strict Mode Compliant)
const getAdminLiveAnalytics = async () => {
    let activeVisitors = [];
    let todaySummary = { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 };
    let yesterdaySummary = { total_sessions_yesterday: 0, unique_visitors_yesterday: 0, avg_duration_yesterday: 0 };
    let topPages = [];
    let trendData = [];
    let totalLifetimeOrders = 0;

    // A. Active Visitors (Within last 2 minutes, simple SQL query)
    try {
        const [rows] = await db.execute(`
            SELECT 
                vs.session_id,
                vs.visitor_uuid,
                COALESCE(u.name, 'Guest') AS user_name,
                u.email AS user_email,
                vs.device_type,
                vs.browser,
                vs.os,
                vs.landing_page,
                vs.total_duration_sec,
                vs.last_active_at,
                (SELECT page_path FROM page_views WHERE session_id = vs.session_id ORDER BY view_id DESC LIMIT 1) AS current_page
            FROM visitor_sessions vs
            LEFT JOIN users u ON vs.user_id = u.user_id
            WHERE vs.is_active = 1 
              AND vs.last_active_at >= NOW() - INTERVAL 2 MINUTE
            ORDER BY vs.last_active_at DESC
        `);

        // Smart JavaScript Deduplication: 1 person = 1 row
        const uniqueVisitorMap = new Map();
        for (const r of rows) {
            if (!uniqueVisitorMap.has(r.visitor_uuid)) {
                uniqueVisitorMap.set(r.visitor_uuid, r);
            }
        }
        activeVisitors = Array.from(uniqueVisitorMap.values());
    } catch (err) {
        console.error('[LIVE_ANALYTICS] activeVisitors query error:', err.message);
    }

    // B. Today's Summary
    try {
        const [today] = await db.execute(`
            SELECT 
                COUNT(DISTINCT session_id) AS total_sessions_today,
                COUNT(DISTINCT visitor_uuid) AS unique_visitors_today,
                COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_sec
            FROM visitor_sessions
            WHERE DATE(started_at) = CURDATE()
        `);
        if (today.length > 0) todaySummary = today[0];
    } catch (err) {
        console.error('[LIVE_ANALYTICS] todaySummary error:', err.message);
    }

    // C. Yesterday's Summary
    try {
        const [yesterday] = await db.execute(`
            SELECT 
                COUNT(DISTINCT session_id) AS total_sessions_yesterday,
                COUNT(DISTINCT visitor_uuid) AS unique_visitors_yesterday,
                COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_yesterday
            FROM visitor_sessions
            WHERE DATE(started_at) = CURDATE() - INTERVAL 1 DAY
        `);
        if (yesterday.length > 0) yesterdaySummary = yesterday[0];
    } catch (err) {
        console.error('[LIVE_ANALYTICS] yesterdaySummary error:', err.message);
    }

    // D. Top 5 Viewed Saree Pages Today
    try {
        const [pages] = await db.execute(`
            SELECT 
                page_path, 
                COUNT(*) AS total_views, 
                COALESCE(ROUND(AVG(time_spent_sec)), 0) AS avg_time_spent
            FROM page_views
            WHERE DATE(entered_at) = CURDATE()
            GROUP BY page_path
            ORDER BY total_views DESC 
            LIMIT 5
        `);
        topPages = pages;
    } catch (err) {
        console.error('[LIVE_ANALYTICS] topPages error:', err.message);
    }

    // E. 12-Hour Activity Trend for SVG Chart
    try {
        const [trend] = await db.execute(`
            SELECT 
                DATE_FORMAT(entered_at, '%l%p') AS time,
                COUNT(DISTINCT session_id) AS visitors,
                COUNT(*) AS pageViews
            FROM page_views
            WHERE entered_at >= NOW() - INTERVAL 12 HOUR
            GROUP BY HOUR(entered_at), DATE_FORMAT(entered_at, '%l%p')
            ORDER BY MIN(entered_at) ASC
        `);
        trendData = trend;
    } catch (err) {
        console.error('[LIVE_ANALYTICS] trendData error:', err.message);
    }

    // F. Total Lifetime Orders (Failsafe count)
    try {
        const [ordersCount] = await db.execute(`SELECT COUNT(*) AS total_orders FROM orders`);
        totalLifetimeOrders = ordersCount[0]?.total_orders || 0;
    } catch (err) {
        console.error('[LIVE_ANALYTICS] ordersCount error:', err.message);
    }

    return {
        activeNowCount: activeVisitors.length,
        activeVisitors,
        todaySummary,
        yesterdaySummary,
        topPages,
        trendData,
        totalLifetimeOrders
    };
};

module.exports = {
    initOrUpdateSessionInDB,
    recordPageViewInDB,
    processHeartbeatInDB,
    markSessionExitInDB,
    recordAnalyticsEventInDB,
    getAdminLiveAnalytics
};