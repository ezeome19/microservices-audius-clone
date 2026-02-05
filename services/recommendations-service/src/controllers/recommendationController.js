const {
    audiusService: {
        getTrendingTracks,
        mapAudiusTrack
    }
} = require('@spotify-backend/shared');

/**
 * Get personalized recommendations for user
 * Since we are now Audius-only and read-only, we fallback to global trending for "recommendations".
 * In a real implementation with Audius, we'd analyze user's Audius history (if we had access via oauth).
 */
async function getRecommendations(req, res) {
    const tracksRaw = await getTrendingTracks(20);
    const recommendations = tracksRaw.map(mapAudiusTrack).filter(Boolean);

    res.json({
        message: 'Recommendations generated successfully',
        recommendations
    });
}

/**
 * Get similar songs
 * (Placeholder: returns trending as well for now)
 */
async function getSimilarSongs(req, res) {
    const tracksRaw = await getTrendingTracks(10);
    const similarSongs = tracksRaw.map(mapAudiusTrack).filter(Boolean);

    res.json({
        message: 'Similar songs retrieved successfully',
        similarSongs
    });
}

/**
 * Get trending songs
 */
async function getTrending(req, res) {
    const tracksRaw = await getTrendingTracks(20);
    const trending = tracksRaw.map(mapAudiusTrack).filter(Boolean);

    res.json({
        message: 'Trending songs retrieved successfully',
        trending
    });
}

module.exports = {
    getRecommendations,
    getSimilarSongs,
    getTrending
};
