const { CacheManager } = require('../../../../shared');
const UserPreference = require('../models/userPreference');

// Initialize cache manager
const cache = new CacheManager(global.redisClient, 3600); // 1 hour TTL


// Generate recommendations for a user
async function generateUserRecommendations(userId) {
    const cacheKey = `recommendations:${userId}`;

    // Check cache first
    const cachedRecs = await cache.get(cacheKey);
    if (cachedRecs) {
        return { recommendations: cachedRecs, cached: true };
    }

    // Get user preferences
    let preferences = await UserPreference.findOne({ userId });

    // Generate recommendations (simplified algorithm)
    const recommendations = await generateRecommendations(preferences);

    // Cache the results
    await cache.set(cacheKey, recommendations);

    return { recommendations, cached: false };
}

// Update user preferences
async function updateUserPreferences(userId, preferencesData) {
    const { favoriteGenres, favoriteArtists, likedSongs, dislikedSongs } = preferencesData;

    let preferences = await UserPreference.findOne({ userId });

    if (!preferences) {
        preferences = new UserPreference({ userId });
    }

    if (favoriteGenres) preferences.favoriteGenres = favoriteGenres;
    if (favoriteArtists) preferences.favoriteArtists = favoriteArtists;
    if (likedSongs) preferences.likedSongs = likedSongs;
    if (dislikedSongs) preferences.dislikedSongs = dislikedSongs;

    await preferences.save();

    // Invalidate cache
    await cache.del(`recommendations:${userId}`);

    return preferences;
}

// Get user preferences
async function getUserPreferences(userId) {
    const preferences = await UserPreference.findOne({ userId });
    return preferences || {};
}

// Create recommended playlist
async function createRecommendedPlaylist(playlistData) {
    const { userId, name, songIds } = playlistData;
    // TODO: Create playlist in music catalog service
    return { userId, name, songIds };
}

// Clear cache for a user
async function clearUserCache(userId) {
    await cache.del(`recommendations:${userId}`);
}

/**
 * Simple recommendation algorithm
 * In production, this would use collaborative filtering, content-based filtering, etc.
 */
async function generateRecommendations(preferences) {
    const recommendations = [];

    if (preferences && preferences.favoriteGenres.length > 0) {
        // TODO: Query music catalog service for songs in favorite genres
        recommendations.push({
            songId: 'sample-song-1',
            reason: `Based on your favorite genre: ${preferences.favoriteGenres[0]}`,
            score: 0.95
        });
    }

    if (preferences && preferences.favoriteArtists.length > 0) {
        // TODO: Query music catalog service for songs by favorite artists
        recommendations.push({
            songId: 'sample-song-2',
            reason: `Based on your favorite artist`,
            score: 0.90
        });
    }

    // Default recommendations
    if (recommendations.length === 0) {
        recommendations.push({
            songId: 'popular-song-1',
            reason: 'Popular this week',
            score: 0.75
        });
    }

    return recommendations;
}

module.exports = {
    generateUserRecommendations,
    updateUserPreferences,
    getUserPreferences,
    createRecommendedPlaylist,
    clearUserCache
};
