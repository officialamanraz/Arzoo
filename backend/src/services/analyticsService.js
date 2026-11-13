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
        // Step 1: Ensure session exists (using basic UPSERT syntax compatible with all MySQL versions)
        const query = `
            INSERT INTO visitor_sessions 
                (session_id, visitor_uuid, user_id, device_type, browser, os, ip_address, referrer, landing_page, is_active, last_active_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                user_id = COALESCE(VALUES(user_id), user_id),
                is_active = 1,
                last_active_at = NOW()
        `;
        
        // Safeguard for potentially missing columns (like landing_page)
        const params = [
            sessionId, visitorUuid, userId, 
            deviceType?.substring(0, 50) || 'desktop', 
            browser?.substring(0, 50) || 'Unknown', 
            os?.substring(0, 50) || 'Unknown', 
            ipAddress?.substring(0, 50) || null, 
            referrer?.substring(0, 255) || '', 
            landingPage?.substring(0, 255) || '/',
        ];

        await db.execute(query, params);

        // Step 2: Auto-link previous guest sessions to the user if logged in
        if (userId && visitorUuid) {
            await db.execute(
                `UPDATE visitor_sessions SET user_id = ? WHERE visitor_uuid = ? AND user_id IS NULL`,
                [userId, visitorUuid]
            );
        }
        return { sessionId };
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] initOrUpdateSession error:', err.message);
        // Silently return success to prevent frontend 500 error cascade
        return { sessionId };
    }
};

// 2. Record new page view
const recordPageViewInDB = async ({ sessionId, pagePath, pageTitle = '', productId = null }) => {
    try {
        const query = `
            INSERT INTO page_views (session_id, page_path, page_title, product_id, entered_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        const params = [
            sessionId, 
            pagePath?.substring(0, 255) || '/', 
            pageTitle?.substring(0, 255) || '', 
            productId
        ];
        
        const [result] = await db.execute(query, params);
        return result.insertId || null;
    } catch (err) {
        console.error('[ANALYTICS_SERVICE] recordPageView error:', err.message);
        return null;
    }
};

// 3. Heartbeat: Safe time increment
const processHeartbeatInDB = async ({ sessionId, visitorUuid, userId = null, viewId = null, incrementSec = 25 }) => {
    try {
        if (!sessionId) return;

        // Try to update duration, catching if column 'total_duration_sec' doesn't exist
        try {
            await db.execute(
                `UPDATE visitor_sessions 
                 SET total_duration_sec = COALESCE(total_duration_sec, 0) + ?, 
                     user_id = COALESCE(?, user_id),
                     last_active_at = NOW(), 
                     is_active = 1 
                 WHERE session_id = ?`,
                [incrementSec, userId, sessionId]
            );
        } catch (updateErr) {
            // Fallback: If total_duration_sec column is missing, just update last_active_at
            await db.execute(
                `UPDATE visitor_sessions 
                 SET user_id = COALESCE(?, user_id), last_active_at = NOW(), is_active = 1 
                 WHERE session_id = ?`,
                [userId, sessionId]
            );
        }

        // Link old guest sessions
        if (userId && visitorUuid) {
            await db.execute(
                `UPDATE visitor_sessions SET user_id = ? WHERE visitor_uuid = ? AND user_id IS NULL`,
                [userId, visitorUuid]
            );
        }

        // Update view time
        if (viewId) {
            await db.execute(
                `UPDATE page_views 
                 SET time_spent_sec = COALESCE(time_spent_sec, 0) + ?, exited_at = NOW()
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
            `UPDATE visitor_sessions SET is_active = 0, last_active_at = NOW() WHERE session_id = ?`,
            [sessionId]
        );

        if (viewId && finalPageTimeSec > 0) {
            await db.execute(
                `UPDATE page_views SET time_spent_sec = COALESCE(time_spent_sec, 0) + ?, exited_at = NOW() WHERE view_id = ?`,
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

// 6. Admin Dashboard Live Stats (Highly resilient to missing columns)
// 6. Admin Dashboard Live & Date-Filtered Stats
const getAdminLiveAnalytics = async (selectedDate = null, range = 'day') => {
    // Validate date (YYYY-MM-DD), fallback to today in SQL if not provided
    const targetDate = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) 
        ? selectedDate 
        : new Date().toISOString().split('T')[0];

    let activeVisitors = [];
    let todaySummary = { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 };
    let yesterdaySummary = { total_sessions_yesterday: 0, unique_visitors_yesterday: 0, avg_duration_yesterday: 0 };
    let topPages = [];
    let sessionLogs = [];
    let trendData = [];
    let totalLifetimeOrders = 0;

    // Date range condition helper for Top Pages & Session Logs
    let dateFilterVS = `DATE(vs.last_active_at) = ?`;
    let dateFilterPV = `DATE(entered_at) = ?`;
    if (range === '7d') {
        dateFilterVS = `DATE(vs.last_active_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
        dateFilterPV = `DATE(entered_at) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?`;
    } else if (range === '30d') {
        dateFilterVS = `DATE(vs.last_active_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
        dateFilterPV = `DATE(entered_at) BETWEEN DATE_SUB(?, INTERVAL 29 DAY) AND ?`;
    }
    const rangeParams = range === 'day' ? [targetDate] : [targetDate, targetDate];

    // A. Live Active Visitors (Real-time right now)
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
                COALESCE(vs.total_duration_sec, 0) AS total_duration_sec,
                vs.started_at,
                vs.last_active_at,
                (SELECT page_path FROM page_views WHERE session_id = vs.session_id ORDER BY view_id DESC LIMIT 1) AS current_page
            FROM visitor_sessions vs
            LEFT JOIN users u ON vs.user_id = u.user_id
            WHERE vs.is_active = 1 
              AND vs.last_active_at >= NOW() - INTERVAL 2 MINUTE
            ORDER BY vs.last_active_at DESC
        `);

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

    // B. Selected Date Summary
    try {
        const [today] = await db.execute(`
            SELECT 
                COUNT(DISTINCT session_id) AS total_sessions_today,
                COUNT(DISTINCT visitor_uuid) AS unique_visitors_today,
                COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_sec
            FROM visitor_sessions vs
            WHERE ${dateFilterVS}
        `, rangeParams);
        if (today.length > 0) todaySummary = today[0];
    } catch (err) {
        console.error('[LIVE_ANALYTICS] todaySummary error:', err.message);
    }

    // C. Previous Day Summary (for growth comparison %)
    try {
        const [yesterday] = await db.execute(`
            SELECT 
                COUNT(DISTINCT session_id) AS total_sessions_yesterday,
                COUNT(DISTINCT visitor_uuid) AS unique_visitors_yesterday,
                COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_yesterday
            FROM visitor_sessions
            WHERE DATE(last_active_at) = DATE_SUB(?, INTERVAL 1 DAY)
        `, [targetDate]);
        if (yesterday.length > 0) yesterdaySummary = yesterday[0];
    } catch (err) {}

    // D. Top Pages for Selected Date / Range
    try {
        const [pages] = await db.execute(`
            SELECT 
                page_path, 
                COUNT(*) AS total_views, 
                COALESCE(ROUND(AVG(time_spent_sec)), 0) AS avg_time_spent,
                COALESCE(SUM(time_spent_sec), 0) AS total_time_spent
            FROM page_views
            WHERE ${dateFilterPV}
            GROUP BY page_path
            ORDER BY total_views DESC 
            LIMIT 8
        `, rangeParams);
        topPages = pages;
    } catch (err) {}

    // E. Detailed User Session Logs (Date, Start Time, Last Active Time & Time Spent)
    try {
        const [logs] = await db.execute(`
            SELECT 
                vs.session_id,
                vs.visitor_uuid,
                COALESCE(u.name, 'Guest Visitor') AS user_name,
                vs.device_type,
                vs.browser,
                vs.landing_page,
                COALESCE(vs.total_duration_sec, 0) AS total_duration_sec,
                vs.started_at,
                vs.last_active_at,
                vs.is_active,
                (SELECT COUNT(*) FROM page_views pv WHERE pv.session_id = vs.session_id) AS pages_visited,
                (SELECT page_path FROM page_views pv WHERE pv.session_id = vs.session_id ORDER BY pv.view_id DESC LIMIT 1) AS last_page
            FROM visitor_sessions vs
            LEFT JOIN users u ON vs.user_id = u.user_id
            WHERE ${dateFilterVS}
            ORDER BY vs.last_active_at DESC
            LIMIT 25
        `, rangeParams);
        sessionLogs = logs;
    } catch (err) {
        console.error('[LIVE_ANALYTICS] sessionLogs error:', err.message);
    }

    // F. Hourly Trend for Selected Date
    try {
        const [trend] = await db.execute(`
            SELECT 
                DATE_FORMAT(entered_at, '%l%p') AS time,
                COUNT(DISTINCT session_id) AS visitors,
                COUNT(*) AS pageViews
            FROM page_views
            WHERE DATE(entered_at) = ?
            GROUP BY HOUR(entered_at), DATE_FORMAT(entered_at, '%l%p')
            ORDER BY MIN(entered_at) ASC
        `, [targetDate]);
        trendData = trend;
    } catch (err) {}

    // G. Total Lifetime Orders
    try {
        const [ordersCount] = await db.execute(`SELECT COUNT(*) AS total_orders FROM orders`);
        totalLifetimeOrders = ordersCount[0]?.total_orders || 0;
    } catch (err) {}

    return {
        selectedDate: targetDate,
        range,
        activeNowCount: activeVisitors.length,
        activeVisitors,
        todaySummary,
        yesterdaySummary,
        topPages,
        sessionLogs,
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