const express = require('express');
const router = express.Router();
const {
    createEvent,
    fetchMetrics,
    getTimeSeriesReport,
    getUserActivity,
    getTrending
} = require('../controllers/analyticsController');

// Track event (Admin only)
router.post('/events', createEvent);

// Get metrics (Admin only)
router.get('/metrics', fetchMetrics);

// Generate time-series reports (Admin only)
router.get('/reports/time-series', getTimeSeriesReport);

// Get user activity report (Admin only)
router.get('/reports/user-activity/:userId', getUserActivity);

// Get popular songs by time period (Admin only)
router.get('/reports/trending', getTrending);

module.exports = router;
