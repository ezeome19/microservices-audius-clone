const {
    audiusService: {
        getTrendingTracks,
        getTrack,
        mapAudiusTrack
    }
} = require('@spotify-backend/shared');


// Get all songs (Trending from Audius)
async function getAllSongs(req, res) {
    const { time, genre } = req.query;
    const cache = req.app.locals.cache;
    const cacheKey = `audius:trending:${time || 'allTime'}:${genre || 'all'}:20`;

    let isCached = false;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) isCached = true;
        } catch (err) {
            // Log but continue
        }
    }

    const tracks = await getTrendingTracks(20, time, genre);
    const songs = tracks.map(mapAudiusTrack).filter(Boolean);

    res.json({
        message: isCached ? 'Songs retrieved (cached)' : 'Songs retrieved successfully',
        songs
    });
}

// Get song by ID (From Audius)
async function getSongById(req, res) {
    const cache = req.app.locals.cache;
    const cacheKey = `audius:track:${req.params.id}`;

    let isCached = false;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) isCached = true;
        } catch (err) {
            // Log but continue
        }
    }

    const track = await getTrack(req.params.id);
    if (!track) {
        return res.status(404).json({ message: 'Song not found' });
    }

    res.json({
        message: isCached ? 'Song retrieved (cached)' : 'Song retrieved successfully',
        song: mapAudiusTrack(track)
    });
}

module.exports = {
    getAllSongs,
    getSongById
};
