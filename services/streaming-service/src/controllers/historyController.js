const {
    createListeningRecord,
    getUserHistory,
    getRecentSongs,
    getTopSongs
} = require('../services/historyServices');
const { logger } = require('../../../../shared');


// Track listening event
async function trackListening(req, res, next) {
    try {
        const history = await createListeningRecord(req.user.id, req.body);
        res.json({ message: 'Listening event tracked', history });
    } catch (error) {
        next(error);
    }
}

// Get user's listening history
async function getHistory(req, res) {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const result = await getUserHistory(req.user.id, limit, skip);
    res.json({
        message: 'Listening history retrieved successfully',
        ...result
    });
}

// Get recently played songs
async function getRecent(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const recentSongs = await getRecentSongs(req.user.id, limit);
    res.json({
        message: 'Recent songs retrieved successfully',
        recentSongs
    });
}

// Get most played songs
async function getTop(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;

    const result = await getTopSongs(req.user.id, limit, days);
    res.json({
        message: 'Top songs retrieved successfully',
        ...result
    });
}

module.exports = {
    trackListening,
    getHistory,
    getRecent,
    getTop
};
