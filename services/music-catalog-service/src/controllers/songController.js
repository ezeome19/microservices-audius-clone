const {
    audiusService: {
        getTrendingTracks,
        getTrack,
        getArtistTracks,
        mapAudiusTrack
    }
} = require('../../../../shared');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001';

// Get all songs (Trending from Audius or local platform)
async function getAllSongs(req, res) {
    const { time, genre, source, limit = 20 } = req.query;
    const cache = req.app.locals.cache;
    const cacheKey = `music:trending:${source || 'audius'}:${time || 'allTime'}:${genre || 'all'}:${limit}`;

    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json({ message: 'Songs retrieved (cached)', songs: cached });
        } catch (err) { }
    }

    let songs = [];

    if (source === 'local') {
        const { Song, Artist } = require('../models');
        songs = await Song.findAll({
            include: [{ model: Artist, as: 'artist', attributes: ['name'] }],
            order: [['playCount', 'DESC'], ['likeCount', 'DESC']],
            limit: parseInt(limit)
        });
    } else {
        const tracks = await getTrendingTracks(parseInt(limit), time, genre);
        songs = tracks.map(mapAudiusTrack).filter(Boolean);
    }

    if (cache && songs.length > 0) {
        await cache.set(cacheKey, songs, 300).catch(() => null);
    }

    res.json({
        message: 'Songs retrieved successfully',
        songs
    });
}

// Get song by ID (From Audius with local fallback)
async function getSongById(req, res) {
    const songId = req.params.id;
    const cache = req.app.locals.cache;
    const cacheKey = `audius:track:${songId}`;

    let isCached = false;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) isCached = true;
        } catch (err) {
            // Log but continue
        }
    }

    try {
        const track = await getTrack(songId);
        if (track) {
            return res.json({
                message: isCached ? 'Song retrieved (cached)' : 'Song retrieved successfully',
                song: mapAudiusTrack(track)
            });
        }
    } catch (err) {
        console.warn(`[SongController] Audius fetch failed for ${songId}, trying local database:`, err.message);
    }

    // Fallback to local database
    try {
        const { Song, Artist } = require('../models');
        const localSong = await Song.findByPk(songId, {
            include: [{ model: Artist, as: 'artist', attributes: ['name'] }]
        });
        if (localSong) {
            return res.json({
                message: 'Song retrieved from local database',
                song: localSong
            });
        }
    } catch (err) {
        console.error(`[SongController] Local database fetch failed for ${songId}:`, err.message);
    }

    return res.status(404).json({ message: 'Song not found' });
}

// Get personalized feed based on user's preferred artists
async function getPersonalizedFeed(req, res) {
    try {
        const userId = req.user.id;

        // Fetch user's preferred artists from auth service using /me endpoint
        const userResponse = await axios.get(
            `${AUTH_SERVICE_URL}/me`,
            {
                headers: {
                    'x-auth-token': req.headers['x-auth-token']
                }
            }
        );

        const preferredArtists = userResponse.data.user.preferredArtists || [];
        console.log(`[Personalized Feed] User ${userId} has ${preferredArtists.length} preferred artists:`, preferredArtists);

        // If no preferred artists, fall back to trending
        if (preferredArtists.length === 0) {
            console.log('[Personalized Feed] No preferred artists, showing trending');
            const tracks = await getTrendingTracks(20);
            const songs = tracks.map(mapAudiusTrack).filter(Boolean);
            return res.json({
                message: 'No preferred artists set. Showing trending tracks.',
                songs,
                source: 'trending'
            });
        }

        // Fetch tracks from each preferred artist
        const allTracks = [];
        for (const artistId of preferredArtists) {
            try {
                const artistTracks = await getArtistTracks(artistId);
                allTracks.push(...artistTracks);
            } catch (error) {
                // Skip artists that fail to load
                console.error(`Failed to load tracks for artist ${artistId}:`, error.message);
            }
        }

        console.log(`[Personalized Feed] Total tracks fetched: ${allTracks.length}`);

        // Map and filter tracks
        const songs = allTracks
            .map(mapAudiusTrack)
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
            .slice(0, 50); // Limit to 50 tracks

        console.log(`[Personalized Feed] Returning ${songs.length} songs after mapping and filtering`);

        // If no tracks found from preferred artists, fall back to trending
        if (songs.length === 0) {
            console.log('[Personalized Feed] No tracks found, showing trending');
            const tracks = await getTrendingTracks(20);
            const fallbackSongs = tracks.map(mapAudiusTrack).filter(Boolean);
            return res.json({
                message: 'No tracks found from preferred artists. Showing trending tracks.',
                songs: fallbackSongs,
                source: 'trending'
            });
        }

        res.json({
            message: 'Personalized feed retrieved successfully',
            songs,
            source: 'personalized',
            artistCount: preferredArtists.length
        });
    } catch (error) {
        // Only log serious errors, not expected status code errors from Audius service
        if (!error.message.includes('400') && !error.message.includes('404')) {
            console.error('Personalized feed error:', error.message);
        }
        // Fall back to trending on error
        const tracks = await getTrendingTracks(20);
        const songs = tracks.map(mapAudiusTrack).filter(Boolean);
        res.json({
            message: 'Error loading personalized feed. Showing trending tracks.',
            songs,
            source: 'trending'
        });
    }
}

module.exports = {
    getAllSongs,
    getSongById,
    getPersonalizedFeed
};
