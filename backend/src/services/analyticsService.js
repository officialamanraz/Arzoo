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
    return { sessionId };
};

// 2. Record new page view
const recordPageViewInDB = async ({ sessionId, pagePath, pageTitle = '', productId = null }) => {
    const query = `
        INSERT INTO page_views (session_id, page_path, page_title, product_id, entered_at)
        VALUES (?, ?, ?, ?, NOW())
    `;
    const [result] = await db.execute(query, [sessionId, pagePath, pageTitle, productId]);
    return result.insertId;
};

// 3. Heartbeat: Increment active session time & update specific page dwell time
const processHeartbeatInDB = async ({ sessionId, viewId = null, incrementSec = 25 }) => {
    // A. Update overall session duration and activity status
    await db.execute(
        `UPDATE visitor_sessions 
         SET total_duration_sec = total_duration_sec + ?, 
             last_active_at = NOW(), 
             is_active = 1 
         WHERE session_id = ?`,
        [incrementSec, sessionId]
    );

    // B. Update page view dwell time if viewId is provided
    if (viewId) {
        await db.execute(
            `UPDATE page_views 
             SET time_spent_sec = time_spent_sec + ?,
                 exited_at = NOW()
             WHERE view_id = ?`,
            [incrementSec, viewId]
        );
    }
};

// 4. Mark session inactive on exit
const markSessionExitInDB = async ({ sessionId, viewId = null, finalPageTimeSec = 0 }) => {
    await db.execute(
        `UPDATE visitor_sessions 
         SET is_active = 0, last_active_at = NOW() 
         WHERE session_id = ?`,
        [sessionId]
    );

    if (viewId && finalPageTimeSec > 0) {
        await db.execute(
            `UPDATE page_views 
             SET time_spent_sec = time_spent_sec + ?, exited_at = NOW() 
             WHERE view_id = ?`,
            [finalPageTimeSec, viewId]
        );
    }
};

// 5. Log custom high-intent actions (Add to Cart, Checkout click)
const recordAnalyticsEventInDB = async ({ sessionId, eventName, eventCategory = 'engagement', metadata = {} }) => {
    const query = `
        INSERT INTO analytics_events (session_id, event_name, event_category, metadata)
        VALUES (?, ?, ?, ?)
    `;
    await db.execute(query, [sessionId, eventName, eventCategory, JSON.stringify(metadata)]);
};

// 6. Admin Dashboard Live Stats (Last 3 minutes active)
// 6. Admin Dashboard Live Stats (Last 3 minutes active)
const getAdminLiveAnalytics = async () => {
    // A. Currently active sessions
    const [activeVisitors] = await db.execute(`
        SELECT 
            vs.session_id, vs.visitor_uuid, COALESCE(u.name, 'Guest') AS user_name,
            u.email AS user_email, vs.device_type, vs.browser, vs.os, vs.landing_page,
            vs.total_duration_sec, vs.last_active_at,
            (SELECT page_path FROM page_views WHERE session_id = vs.session_id ORDER BY view_id DESC LIMIT 1) AS current_page
        FROM visitor_sessions vs
        LEFT JOIN users u ON vs.user_id = u.user_id
        WHERE vs.last_active_at >= NOW() - INTERVAL 3 MINUTE
        ORDER BY vs.last_active_at DESC
    `);

    // B. Today's aggregate numbers vs Yesterday's for Trend Calculation
    const [todaySummary] = await db.execute(`
        SELECT 
            COUNT(DISTINCT session_id) AS total_sessions_today,
            COUNT(DISTINCT visitor_uuid) AS unique_visitors_today,
            COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_sec
        FROM visitor_sessions
        WHERE DATE(started_at) = CURDATE()
    `);

    const [yesterdaySummary] = await db.execute(`
        SELECT 
            COUNT(DISTINCT session_id) AS total_sessions_yesterday,
            COUNT(DISTINCT visitor_uuid) AS unique_visitors_yesterday,
            COALESCE(ROUND(AVG(total_duration_sec)), 0) AS avg_duration_yesterday
        FROM visitor_sessions
        WHERE DATE(started_at) = CURDATE() - INTERVAL 1 DAY
    `);

    // C. Top 5 viewed saree pages today
    const [topPages] = await db.execute(`
        SELECT 
            page_path, COUNT(*) AS total_views, COALESCE(ROUND(AVG(time_spent_sec)), 0) AS avg_time_spent
        FROM page_views
        WHERE DATE(entered_at) = CURDATE()
        GROUP BY page_path
        ORDER BY total_views DESC LIMIT 5
    `);

    // D. Hourly Trend for the Chart (Last 12 Hours)
    const [trendData] = await db.execute(`
        SELECT 
            DATE_FORMAT(entered_at, '%l%p') as time,
            COUNT(DISTINCT session_id) as visitors,
            COUNT(*) as pageViews
        FROM page_views
        WHERE entered_at >= NOW() - INTERVAL 12 HOUR
        GROUP BY HOUR(entered_at), DATE_FORMAT(entered_at, '%l%p')
        ORDER BY HOUR(entered_at) ASC
    `);

    // E. Total Lifetime Orders (For the Promo Banner)
    const [ordersCount] = await db.execute(`
        SELECT COUNT(order_id) AS total_orders FROM orders WHERE payment_status = 'paid'
    `);

    return {
        activeNowCount: activeVisitors.length,
        activeVisitors,
        todaySummary: todaySummary[0] || { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
        yesterdaySummary: yesterdaySummary[0] || { total_sessions_yesterday: 0, unique_visitors_yesterday: 0, avg_duration_yesterday: 0 },
        topPages,
        trendData,
        totalLifetimeOrders: ordersCount[0].total_orders || 0
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