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

const axios = require('axios');
const MUSIC_SERVICE_URL = process.env.MUSIC_SERVICE_URL || 'http://127.0.0.1:3002';

// Get most played songs
async function getTop(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const isGlobal = req.query.global === 'true' && req.user.isAdmin;

    try {
        const { topSongs, period } = await getTopSongs(isGlobal ? null : req.user.id, limit, days);

        // Enrich with song metadata from music-catalog-service
        const enrichedSongs = await Promise.all(topSongs.map(async (item) => {
            try {
                const songRes = await axios.get(`${MUSIC_SERVICE_URL}/${item._id}`, {
                    headers: { 'x-auth-token': req.headers['x-auth-token'] }
                });
                if (songRes.data && songRes.data.song) {
                    return {
                        ...item,
                        ...songRes.data.song
                    };
                }
            } catch (err) {
                logger.warn(`Failed to enrich song ${item._id}: ${err.message}`);
            }
            return item;
        }));

        res.json({
            message: `Top songs (${isGlobal ? 'Global' : 'Personal'}) retrieved successfully`,
            topSongs: enrichedSongs,
            period
        });
    } catch (error) {
        logger.error('Error in getTop:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    trackListening,
    getHistory,
    getRecent,
    getTop
};
