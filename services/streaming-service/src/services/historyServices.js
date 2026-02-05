const ListeningHistory = require('../models/listeningHistory');


// Create listening history record
async function createListeningRecord(userId, listeningData) {
    const { songId, duration, completed, device, location } = listeningData;

    // Validate duration - must be a valid number
    if (duration === undefined || duration === null || isNaN(duration)) {
        const error = new Error('Invalid duration provided for listening history');
        error.name = 'ValidationError';
        throw error;
    }

    const history = new ListeningHistory({
        userId,
        songId,
        duration,
        completed,
        device,
        location
    });

    await history.save();
    return history;
}

// Get user's listening history with pagination
async function getUserHistory(userId, limit = 50, skip = 0) {
    const history = await ListeningHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);

    const total = await ListeningHistory.countDocuments({ userId });

    return { history, total, limit, skip };
}

// Get recently played songs (unique songs)
async function getRecentSongs(userId, limit = 10) {
    const recentSongs = await ListeningHistory.aggregate([
        { $match: { userId } },
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: '$songId',
                lastPlayed: { $first: '$timestamp' },
                playCount: { $sum: 1 }
            }
        },
        { $sort: { lastPlayed: -1 } },
        { $limit: limit }
    ]);

    return recentSongs;
}

// Get most played songs within a time period
async function getTopSongs(userId, limit = 10, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const topSongs = await ListeningHistory.aggregate([
        {
            $match: {
                userId,
                timestamp: { $gte: since }
            }
        },
        {
            $group: {
                _id: '$songId',
                playCount: { $sum: 1 },
                totalDuration: { $sum: '$duration' }
            }
        },
        { $sort: { playCount: -1 } },
        { $limit: limit }
    ]);

    return { topSongs, period: `${days} days` };
}

module.exports = {
    createListeningRecord,
    getUserHistory,
    getRecentSongs,
    getTopSongs
};
