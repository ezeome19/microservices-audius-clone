const { sequelize } = require('../config/timescaledb');
const Event = require('../models/event');
const { Op } = require('sequelize');


// Track new event
async function trackEvent(eventData) {
    const { eventType, userId, songId, metadata, device, location } = eventData;

    return await Event.create({
        eventType,
        userId,
        songId,
        metadata,
        device,
        location
    });
}

// Get metrics for a time period
async function getMetrics(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Total events
    const totalEvents = await Event.count({
        where: { timestamp: { [Op.gte]: since } }
    });

    // Events by type
    const eventsByType = await Event.findAll({
        attributes: [
            'eventType',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { timestamp: { [Op.gte]: since } },
        group: ['eventType']
    });

    // Unique users
    const uniqueUsers = await Event.count({
        distinct: true,
        col: 'userId',
        where: { timestamp: { [Op.gte]: since } }
    });

    // Most played songs
    const topSongs = await Event.findAll({
        attributes: [
            'songId',
            [sequelize.fn('COUNT', sequelize.col('id')), 'playCount']
        ],
        where: {
            timestamp: { [Op.gte]: since },
            eventType: 'song_played',
            songId: { [Op.ne]: null }
        },
        group: ['songId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
    });

    return {
        totalEvents,
        uniqueUsers,
        eventsByType,
        topSongs
    };
}

// Generate time-series report
async function generateTimeSeriesReport(days = 7, interval = '1 hour') {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const timeSeries = await sequelize.query(`
        SELECT 
            time_bucket('${interval}', timestamp) AS bucket,
            event_type,
            COUNT(*) as count
        FROM events
        WHERE timestamp >= :since
        GROUP BY bucket, event_type
        ORDER BY bucket DESC
    `, {
        replacements: { since },
        type: sequelize.QueryTypes.SELECT
    });

    return timeSeries;
}

// Get user activity report
async function getUserActivityReport(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activity = await sequelize.query(`
        SELECT 
            time_bucket('1 day', timestamp) AS day,
            COUNT(*) as event_count,
            COUNT(DISTINCT CASE WHEN event_type = 'song_played' THEN song_id END) as unique_songs
        FROM events
        WHERE user_id = :userId AND timestamp >= :since
        GROUP BY day
        ORDER BY day DESC
    `, {
        replacements: { userId, since },
        type: sequelize.QueryTypes.SELECT
    });

    return activity;
}

// Get trending songs
async function getTrendingSongs(hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const trending = await Event.findAll({
        attributes: [
            'songId',
            [sequelize.fn('COUNT', sequelize.col('id')), 'playCount'],
            [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueListeners']
        ],
        where: {
            timestamp: { [Op.gte]: since },
            eventType: 'song_played',
            songId: { [Op.ne]: null }
        },
        group: ['songId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 20
    });

    return trending;
}

module.exports = {
    trackEvent,
    getMetrics,
    generateTimeSeriesReport,
    getUserActivityReport,
    getTrendingSongs
};
