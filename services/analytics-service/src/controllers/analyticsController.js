const {
    trackEvent,
    getMetrics,
    generateTimeSeriesReport,
    getUserActivityReport
} = require('../services/analyticsServices');

const { getTrendingTracks } = require('../../../../shared/utils/audiusService');


// Track event (Admin only)
async function createEvent(req, res) {
    const event = await trackEvent(req.body);
    res.json({
        message: 'Event tracked',
        event
    });
}

// Get metrics (Admin only)
async function fetchMetrics(req, res) {
    const days = parseInt(req.query.days) || 7;
    const metrics = await getMetrics(days);

    res.json({
        message: 'Admin access granted',
        period: `${days} days`,
        metrics
    });
}

// Generate time-series reports (Admin only)
async function getTimeSeriesReport(req, res) {
    const days = parseInt(req.query.days) || 7;

    // Audit #6: SQL Injection Protection - Whitelist allowed intervals
    const ALLOWED_INTERVALS = ['1 minute', '5 minutes', '1 hour', '1 day', '1 week'];
    const interval = ALLOWED_INTERVALS.includes(req.query.interval)
        ? req.query.interval
        : '1 hour';

    const timeSeries = await generateTimeSeriesReport(days, interval);

    res.json({
        message: 'Admin access granted',
        period: `${days} days`,
        interval,
        timeSeries
    });
}

// Get user activity report (Admin only)
async function getUserActivity(req, res) {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const activity = await getUserActivityReport(userId, days);

    res.json({
        message: 'Admin access granted',
        userId,
        period: `${days} days`,
        activity
    });
}

// Get popular songs by time period (Admin only)
async function getTrending(req, res) {
    const hours = parseInt(req.query.hours) || 24;
    // Audius trending is general, ignores hours for now
    const trending = await getTrendingTracks();

    res.json({
        message: 'Admin access granted',
        period: `${hours} hours`,
        trending
    });
}

module.exports = {
    createEvent,
    fetchMetrics,
    getTimeSeriesReport,
    getUserActivity,
    getTrending
};
