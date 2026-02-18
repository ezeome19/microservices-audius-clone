const {
    audiusService: {
        getTrendingTracks,
        getArtistTracks,
        getRecommendedTracks,
        mapAudiusTrack
    }
} = require('../../../../shared');
const axios = require('axios');

const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://127.0.0.1:3004';

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
 */
async function getSimilarSongs(req, res) {
    try {
        const { songId } = req.params;
        const tracksRaw = await getRecommendedTracks(songId, 10);
        const similarSongs = tracksRaw.map(mapAudiusTrack).filter(Boolean);

        res.json({
            message: 'Similar songs retrieved successfully',
            similarSongs
        });
    } catch (error) {
        console.error('getSimilarSongs error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
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

/**
 * Get notifications (Trending, Followed Artist Releases, & Similar to Likes)
 */
async function getNotifications(req, res) {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // 1. Fetch weekly trending tracks
        const trendingRaw = await getTrendingTracks(5, 'week');
        const trendingNotifications = trendingRaw.map(track => {
            const mapped = mapAudiusTrack(track);
            return {
                type: 'trending',
                title: '🔥 New on Trending',
                message: `"${mapped.title}" is trending this week!`,
                track: mapped,
                date: new Date() // Trending is "now"
            };
        });

        // 2. Fetch following and likes from social service
        let following = [];
        let likes = [];
        try {
            const [followingRes, likesRes] = await Promise.all([
                axios.get(`${SOCIAL_SERVICE_URL}/following`, { headers: { 'x-auth-token': token } }),
                axios.get(`${SOCIAL_SERVICE_URL}/likes`, { headers: { 'x-auth-token': token } })
            ]);
            following = followingRes.data.following || [];
            likes = likesRes.data.likes || [];
        } catch (err) {
            console.error('[Notifications] Failed to fetch social context:', err.message);
        }

        // 3. Fetch recent releases from followed artists

        // 3. Fetch recent releases from all followed artists concurrently
        const releaseNotifications = [];
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Fetch tracks for all followed artists in parallel
        await Promise.all(following.map(async (f) => {
            try {
                const tracks = await getArtistTracks(f.followingId);
                (tracks || []).forEach(t => {
                    if (!t.release_date) return;
                    const releaseDate = new Date(t.release_date);
                    if (releaseDate >= twoWeeksAgo) {
                        const mapped = mapAudiusTrack(t);
                        releaseNotifications.push({
                            type: 'release',
                            title: '🎵 New Release',
                            message: `${mapped.artistName} released: "${mapped.title}"`,
                            trackId: mapped.id,
                            track: mapped,
                            date: releaseDate
                        });
                    }
                });
            } catch (err) {
                console.error(`[Notifications] Failed to fetch artist ${f.followingId}:`, err.message);
            }
        }));

        // 4. Fetch recommended tracks based on likes concurrently
        const recommendedNotifications = [];
        const topLikes = likes.slice(0, 5); // Increased to top 5 likes

        await Promise.all(topLikes.map(async (like) => {
            try {
                const similarTracks = await getRecommendedTracks(like.id, 3);
                similarTracks.forEach(t => {
                    const mapped = mapAudiusTrack(t);
                    recommendedNotifications.push({
                        type: 'recommendation',
                        title: '✨ Recommended for You',
                        message: `Since you liked "${like.title}", check out "${mapped.title}"`,
                        trackId: mapped.id,
                        track: mapped,
                        date: new Date()
                    });
                });
            } catch (err) {
                console.error(`[Notifications] Failed recommended for ${like.id}:`, err.message);
            }
        }));

        // 5. Combine and sort
        const notifications = [
            ...trendingNotifications,
            ...releaseNotifications,
            ...recommendedNotifications
        ].sort((a, b) => b.date - a.date).slice(0, 25);

        res.json({
            message: 'Notifications retrieved successfully',
            notifications
        });

    } catch (error) {
        console.error('Notifications error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getRecommendations,
    getSimilarSongs,
    getTrending,
    getNotifications
};
