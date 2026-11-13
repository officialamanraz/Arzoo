const jwt = require('jsonwebtoken');
const {
    initOrUpdateSessionInDB,
    recordPageViewInDB,
    processHeartbeatInDB,
    markSessionExitInDB,
    recordAnalyticsEventInDB,
    getAdminLiveAnalytics
} = require('../services/analyticsService');

const extractUserIdFromReq = (req) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'null' && token !== 'undefined') {
                const secret = process.env.JWT_SECRET || 'secret';
                const decoded = jwt.decode(token); // Safe decode without crash
                return decoded?.id || decoded?.user_id || decoded?.userId || null;
            }
        }
    } catch {
        // Fallback to null
    }
    return req.user?.id || req.user?.user_id || null;
};

const parseUserAgent = (ua = '') => {
    let deviceType = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'tablet';
    else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) deviceType = 'mobile';

    let browser = 'Other';
    if (/chrome|crios/i.test(ua) && !/edge|opr\//i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/edge/i.test(ua)) browser = 'Edge';

    return { deviceType, browser };
};

// 1. POST /api/analytics/session
const startSession = async (req, res) => {
    try {
        const { sessionId, visitorUuid, landingPage, referrer } = req.body;
        const userId = extractUserIdFromReq(req);
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const { deviceType, browser } = parseUserAgent(req.headers['user-agent']);

        if (!sessionId || !visitorUuid) {
            return res.status(400).json({ success: false, message: 'Missing session identifiers' });
        }

        await initOrUpdateSessionInDB({
            sessionId,
            visitorUuid,
            userId,
            deviceType,
            browser,
            ipAddress,
            referrer,
            landingPage
        });

        return res.status(200).json({ success: true, sessionId });
    } catch (err) {
        console.error('[ANALYTICS_CTRL] startSession error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 2. POST /api/analytics/pageview
const trackPageView = async (req, res) => {
    try {
        const { sessionId, pagePath, pageTitle, productId } = req.body;
        if (!sessionId || !pagePath) {
            return res.status(400).json({ success: false, message: 'sessionId and pagePath required' });
        }

        const viewId = await recordPageViewInDB({
            sessionId,
            pagePath,
            pageTitle,
            productId: productId ? Number(productId) : null
        });

        return res.status(200).json({ success: true, viewId });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 3. POST /api/analytics/heartbeat
const heartbeat = async (req, res) => {
    try {
        const { sessionId, visitorUuid, viewId, incrementSec } = req.body;
        const userId = extractUserIdFromReq(req);

        if (!sessionId) return res.status(400).json({ success: false });

        await processHeartbeatInDB({
            sessionId,
            visitorUuid,
            userId,
            viewId: viewId ? Number(viewId) : null,
            incrementSec: Number(incrementSec) || 25
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('[ANALYTICS_CTRL] heartbeat error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 4. POST /api/analytics/exit
const trackExit = async (req, res) => {
    try {
        let data = req.body;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch { data = {}; }
        }

        const { sessionId, viewId, finalPageTimeSec } = data;
        if (sessionId) {
            await markSessionExitInDB({
                sessionId,
                viewId: viewId ? Number(viewId) : null,
                finalPageTimeSec: Number(finalPageTimeSec) || 0
            });
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

// 5. POST /api/analytics/event
const trackEvent = async (req, res) => {
    try {
        const { sessionId, eventName, eventCategory, metadata } = req.body;
        if (!sessionId || !eventName) return res.status(400).json({ success: false });

        await recordAnalyticsEventInDB({ sessionId, eventName, eventCategory, metadata });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false });
    }
};

// 6. GET /api/analytics/admin/live
// 6. GET /api/analytics/admin/live?date=YYYY-MM-DD&range=day
const getLiveAnalyticsStats = async (req, res) => {
    try {
        const { date, range } = req.query;
        const stats = await getAdminLiveAnalytics(date, range);
        return res.status(200).json({ success: true, data: stats });
    } catch (err) {
        console.error('[ANALYTICS_CTRL] getLiveAnalyticsStats error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    startSession,
    trackPageView,
    heartbeat,
    trackExit,
    trackEvent,
    getLiveAnalyticsStats
};