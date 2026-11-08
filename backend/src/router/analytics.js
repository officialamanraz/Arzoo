const express = require('express');
const router = express.Router();
const {
    startSession,
    trackPageView,
    heartbeat,
    trackExit,
    trackEvent,
    getLiveAnalyticsStats
} = require('../controllers/analytics');

// Public tracking endpoints (accessible by guests and logged-in users)
router.post('/session', startSession);
router.post('/pageview', trackPageView);
router.post('/heartbeat', heartbeat);
router.post('/exit', trackExit);
router.post('/event', trackEvent);

// Admin-only stats endpoint
router.get('/admin/live', getLiveAnalyticsStats);

module.exports = router;