const {
    followUser,
    unfollowUser,
    getUserFollowers,
    getUserFollowing,
    repostSong,
    unrepostSong,
    getUserReposts,
    commentOnSong,
    updateComment,
    deleteComment,
    getSongComments,
    likeSong,
    unlikeSong,
    getUserLikes,
    getActivityFeed,
    getLocalFollowerCount,
    isFollowing
} = require('../services/socialServices');
const { logger, audiusService } = require('../../../../shared');


// Follow a user
async function follow(req, res) {
    try {
        const result = await followUser(req.user.id, req.params.userId);
        const followerCount = await getLocalFollowerCount(req.params.userId);
        res.json({
            message: 'User followed successfully',
            followerCount,
            ...result
        });
    } catch (error) {
        if (error.message.includes('already following')) {
            const followerCount = await getLocalFollowerCount(req.params.userId);
            return res.status(400).json({
                message: error.message,
                followerCount
            });
        }
        if (error.message.includes('cannot follow yourself')) {
            return res.status(400).json({ message: error.message });
        }

        logger.error('Follow failed:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Unfollow a user
async function unfollow(req, res) {
    const result = await unfollowUser(req.user.id, req.params.userId);
    const followerCount = await getLocalFollowerCount(req.params.userId);
    res.json({
        message: 'User unfollowed successfully',
        followerCount,
        ...result
    });
}

// Get followers
async function getFollowers(req, res) {
    const followers = await getUserFollowers(req.user.id);
    res.json({
        message: 'Followers retrieved successfully',
        userId: req.user.id,
        followers
    });
}

// Get following
async function getFollowing(req, res) {
    const following = await getUserFollowing(req.user.id);
    res.json({
        message: 'Following retrieved successfully',
        userId: req.user.id,
        following
    });
}

// Check follow status
async function checkFollowStatus(req, res) {
    console.log(`[Social Service] checkFollowStatus: followerId=${req.user.id}, followingId=${req.params.userId}`);
    const isFollowingStatus = await isFollowing(req.user.id, req.params.userId);
    console.log(`[Social Service] isFollowing result: ${isFollowingStatus}`);
    res.json({
        isFollowing: isFollowingStatus
    });
}

// Repost a song
async function repost(req, res) {
    const result = await repostSong(req.user.id, req.params.songId);
    res.status(201).json({
        message: 'Song reposted successfully',
        repost: result
    });
}

// Remove repost
async function removeRepost(req, res) {
    const result = await unrepostSong(req.user.id, req.params.songId);
    res.json({
        message: 'Repost removed successfully',
        ...result
    });
}

// Get user's reposts
async function getReposts(req, res) {
    const reposts = await getUserReposts(req.user.id);
    res.json({
        message: 'Reposts retrieved successfully',
        userId: req.user.id,
        reposts
    });
}

// Comment on a song
async function createComment(req, res) {
    const { content, text } = req.body;
    const commentText = text || content; // Accept both 'text' and 'content'

    if (!commentText) {
        logger.error('Create Comment Failed: No comment text provided');
        return res.status(400).json({ message: 'Comment text is required' });
    }

    if (!req.user || !req.user.id) {
        logger.error('Create Comment Failed: No user authentication');
        return res.status(401).json({ message: 'Authentication required' });
    }

    const comment = await commentOnSong(req.user.id, req.params.songId, commentText);

    // Fetch user info from auth service
    const axios = require('axios');
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

    let userName = 'Anonymous';
    try {
        // Auth service routes are mounted at / (not /api/auth)
        // Gateway strips /api/auth prefix when proxying
        const userResponse = await axios.get(`${AUTH_SERVICE_URL}/${req.user.id}`);
        userName = userResponse.data.user?.name || userResponse.data.user?.email || 'Anonymous';
    } catch (error) {
        logger.warn('Failed to fetch user info:', error.message);
    }

    // Return formatted comment
    res.status(201).json({
        message: 'Comment created successfully',
        comment: {
            id: comment.id,
            userId: comment.userId,
            songId: comment.songId,
            text: comment.content, // Map content to text for frontend
            content: comment.content,
            userName: userName,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
        }
    });
}

// Update comment
async function editComment(req, res) {
    const { content } = req.body;
    const comment = await updateComment(req.params.commentId, req.user.id, content);
    res.json({
        message: 'Comment updated successfully',
        comment
    });
}

// Delete comment
async function removeComment(req, res) {
    const comment = await deleteComment(req.params.commentId, req.user.id);
    res.json({
        message: 'Comment deleted successfully',
        comment
    });
}

// Get comments for a song
async function getComments(req, res) {
    const comments = await getSongComments(req.params.songId);

    // Fetch user info for all comments
    const axios = require('axios');
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

    const formattedComments = await Promise.all(comments.map(async (comment) => {
        let userName = 'Anonymous';
        try {
            // Auth service routes are mounted at / (not /api/auth)
            // Gateway strips /api/auth prefix when proxying
            const userResponse = await axios.get(`${AUTH_SERVICE_URL}/${comment.userId}`);
            userName = userResponse.data.user?.name || userResponse.data.user?.email || 'Anonymous';
        } catch (error) {
            logger.warn(`Failed to fetch user info for ${comment.userId}:`, error.message);
        }

        return {
            id: comment.id,
            userId: comment.userId,
            songId: comment.songId,
            text: comment.content, // Map content to text for frontend
            content: comment.content,
            userName: userName,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
        };
    }));

    res.json({
        message: 'Comments retrieved successfully',
        songId: req.params.songId,
        comments: formattedComments
    });
}

// Like a song
async function like(req, res) {
    try {
        const result = await likeSong(req.user.id, req.params.songId);
        res.status(201).json({
            message: 'Song liked successfully',
            like: result
        });
    } catch (error) {
        if (error.message.includes('already liked')) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
}

// Unlike a song
async function unlike(req, res) {
    try {
        const result = await unlikeSong(req.user.id, req.params.songId);
        res.json({
            message: 'Song unliked successfully',
            ...result
        });
    } catch (error) {
        if (error.message.includes('not liked')) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
}


// Get user's liked songs (Enriched with metadata)
async function getLikes(req, res) {
    const likes = await getUserLikes(req.user.id);

    // Fetch track metadata for each liked song
    const enrichedLikes = await Promise.all(likes.map(async (like) => {
        try {
            const trackData = await audiusService.getTrack(like.songId);

            if (trackData) {
                const mapped = audiusService.mapAudiusTrack(trackData);
                return {
                    ...mapped,
                    id: like.songId, // Use Audius ID as the primary ID for frontend
                    databaseId: like.id,
                    likedAt: like.createdAt
                };
            }

            // Fallback for when Audius doesn't return track data
            return {
                id: like.songId,
                title: 'Unknown Track (Audius 404)',
                artistName: 'Unknown Artist',
                databaseId: like.id,
                likedAt: like.createdAt
            };

        } catch (err) {
            logger.error(`Failed to fetch metadata for liked song ${like.songId}:`, err);
            return {
                id: like.songId,
                title: 'Unknown Track',
                artistName: 'Unknown Artist',
                databaseId: like.id
            };
        }
    }));

    res.json({
        message: 'Likes retrieved successfully',
        userId: req.user.id,
        likes: enrichedLikes.filter(Boolean)
    });
}

// Get activity feed
async function getActivity(req, res) {
    const limit = parseInt(req.query.limit) || 50;
    const cache = req.app.locals.cache;
    const cacheKey = `social:activity:${req.user.id}:${limit}`;

    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json({
                message: 'Activity feed retrieved (cached)',
                userId: req.user.id,
                activities: cached
            });
        } catch (err) {
            logger.warn(`Cache GET failed for activity feed: ${err.message}`);
        }
    }

    const activities = await getActivityFeed(req.user.id, limit);

    if (cache && activities.length > 0) {
        try {
            await cache.set(cacheKey, activities, 60); // Cache feed for 1 minute
        } catch (err) {
            logger.warn(`Cache SET failed for activity feed: ${err.message}`);
        }
    }

    res.json({
        message: 'Activity feed retrieved successfully',
        userId: req.user.id,
        activities
    });
}

// Get artist stats (Followers, Following, Tracks)
async function getArtistStats(req, res) {
    const { artistId } = req.params;
    const cache = req.app.locals.cache;
    const cacheKey = `social:artist:stats:${artistId}`;

    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json({
                message: 'Artist stats retrieved (cached)',
                artistId,
                stats: cached
            });
        } catch (err) {
            logger.warn(`Cache GET failed for artist stats ${artistId}: ${err.message}`);
        }
    }

    // 1. Fetch official stats from Audius
    let audiusStats = { follower_count: 0, following_count: 0, track_count: 0 };
    try {
        const artistData = await audiusService.getArtist(artistId);
        if (artistData) {
            audiusStats = {
                follower_count: artistData.follower_count || 0,
                following_count: artistData.followee_count || 0,
                track_count: artistData.track_count || 0
            };
        }
    } catch (err) {
        logger.error(`Failed to fetch Audius stats for artist ${artistId}:`, err);
    }

    // 2. Fetch local follows
    const localFollowersCount = await getLocalFollowerCount(artistId);

    const stats = {
        followers: audiusStats.follower_count + localFollowersCount,
        following: audiusStats.following_count,
        tracks: audiusStats.track_count
    };

    if (cache) {
        try {
            await cache.set(cacheKey, stats, 300); // Cache for 5 mins
        } catch (err) {
            logger.warn(`Cache SET failed for artist stats ${artistId}: ${err.message}`);
        }
    }

    res.json({
        message: 'Artist stats retrieved successfully',
        artistId,
        stats
    });
}

// Get song stats (Plays, Reposts, Favorites, Comments)
async function getSongStats(req, res) {
    const { songId } = req.params;
    const cache = req.app.locals.cache;
    const cacheKey = `social:song:stats:${songId}`;

    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json({
                message: 'Song stats retrieved (cached)',
                songId,
                stats: cached
            });
        } catch (err) {
            logger.warn(`Cache GET failed for song stats ${songId}: ${err.message}`);
        }
    }

    // Import models
    const { Like, Repost } = require('../models');

    // Get counts from database
    const [likes, reposts, comments] = await Promise.all([
        Like.count({ where: { songId } }),
        Repost.count({ where: { songId } }),
        getSongComments(songId).then(c => c.length)
    ]);

    // Get play count from Audius API
    let playCount = 0;
    try {
        const trackData = await audiusService.getTrack(songId);
        if (trackData) {
            playCount = trackData.play_count || 0;
        }
    } catch (err) {
        logger.error(`Failed to fetch play count for song ${songId}:`, err);
    }

    const stats = {
        plays: playCount,
        reposts,
        favorites: likes,
        comments
    };

    if (cache) {
        try {
            await cache.set(cacheKey, stats, 300); // Cache for 5 mins
        } catch (err) {
            logger.warn(`Cache SET failed for song stats ${songId}: ${err.message}`);
        }
    }

    res.json({
        message: 'Song stats retrieved successfully',
        songId,
        stats
    });
}

module.exports = {
    follow,
    unfollow,
    getFollowers,
    getFollowing,
    repost,
    removeRepost,
    getReposts,
    createComment,
    editComment,
    removeComment,
    getComments,
    like,
    unlike,
    getLikes,
    getActivity,
    getArtistStats,
    getSongStats,
    checkFollowStatus
};
