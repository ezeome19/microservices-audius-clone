const { Follow, Repost, Comment, Like } = require('../models');
const { Op } = require('sequelize');


// Follow a user
async function followUser(followerId, followingId) {
    if (followerId === followingId) {
        throw new Error('You cannot follow yourself');
    }

    const existingFollow = await Follow.findOne({
        where: { followerId, followingId }
    });

    if (existingFollow) {
        throw new Error('You are already following this user');
    }

    return await Follow.create({ followerId, followingId });
}

// Unfollow a user
async function unfollowUser(followerId, followingId) {
    const follow = await Follow.findOne({
        where: { followerId, followingId }
    });

    if (!follow) {
        throw new Error('You are not following this user');
    }

    await follow.destroy();
    return { followerId, followingId };
}

// Get user's followers
async function getUserFollowers(userId) {
    return await Follow.findAll({
        where: { followingId: userId },
        attributes: ['followerId', 'createdAt']
    });
}

// Get users that a user is following
async function getUserFollowing(userId) {
    return await Follow.findAll({
        where: { followerId: userId },
        attributes: ['followingId', 'createdAt']
    });
}

// Repost a song
async function repostSong(userId, songId) {
    const existingRepost = await Repost.findOne({
        where: { userId, songId }
    });

    if (existingRepost) {
        throw new Error('You have already reposted this song');
    }

    return await Repost.create({ userId, songId });
}

// Remove repost
async function unrepostSong(userId, songId) {
    const repost = await Repost.findOne({
        where: { userId, songId }
    });

    if (!repost) {
        throw new Error('You have not reposted this song');
    }

    await repost.destroy();
    return { userId, songId };
}

// Get user's reposts
async function getUserReposts(userId) {
    return await Repost.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
    });
}

// Comment on a song or reply to a comment
async function commentOnSong(userId, songId, content, parentId = null) {
    return await Comment.create({ userId, songId, content, parentId });
}

// Update comment
async function updateComment(commentId, userId, content) {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
        throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
        throw new Error('You can only update your own comments');
    }

    await comment.update({ content });
    return comment;
}

// Delete comment
async function deleteComment(commentId, userId) {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
        throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
        throw new Error('You can only delete your own comments');
    }

    await comment.destroy();
    return comment;
}

// Get comments for a song
async function getSongComments(songId) {
    return await Comment.findAll({
        where: { songId },
        order: [['createdAt', 'DESC']]
    });
}

// Like a song or comment
async function likeSong(userId, songId, commentId = null) {
    const where = { userId };
    if (commentId) {
        where.commentId = commentId;
    } else {
        where.songId = songId;
    }

    const existingLike = await Like.findOne({ where });

    if (existingLike) {
        throw new Error(`You have already liked this ${commentId ? 'comment' : 'song'}`);
    }

    return await Like.create({ userId, songId, commentId });
}

// Unlike a song or comment
async function unlikeSong(userId, songId, commentId = null) {
    const where = { userId };
    if (commentId) {
        where.commentId = commentId;
    } else {
        where.songId = songId;
    }

    const like = await Like.findOne({ where });

    if (!like) {
        throw new Error(`You have not liked this ${commentId ? 'comment' : 'song'}`);
    }

    await like.destroy();
    return { userId, songId, commentId };
}

// Get user's liked songs
async function getUserLikes(userId) {
    return await Like.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
    });
}

// Get activity feed for a user
async function getActivityFeed(userId, limit = 50) {
    // Get users that this user is following
    const following = await getUserFollowing(userId);
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
        return [];
    }

    // Get recent activities from followed users
    const [reposts, likes, comments] = await Promise.all([
        Repost.findAll({
            where: { userId: { [Op.in]: followingIds } },
            limit: limit / 3,
            order: [['createdAt', 'DESC']]
        }),
        Like.findAll({
            where: { userId: { [Op.in]: followingIds } },
            limit: limit / 3,
            order: [['createdAt', 'DESC']]
        }),
        Comment.findAll({
            where: { userId: { [Op.in]: followingIds } },
            limit: limit / 3,
            order: [['createdAt', 'DESC']]
        })
    ]);

    // Combine and sort activities
    const activities = [
        ...reposts.map(r => ({ type: 'repost', ...r.toJSON() })),
        ...likes.map(l => ({ type: 'like', ...l.toJSON() })),
        ...comments.map(c => ({ type: 'comment', ...c.toJSON() }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

    return activities;
}

// Get local follower count
async function getLocalFollowerCount(userId) {
    return await Follow.count({
        where: { followingId: userId }
    });
}

// Check if a user is following another
async function isFollowing(followerId, followingId) {
    const follow = await Follow.findOne({
        where: { followerId, followingId }
    });
    return !!follow;
}

module.exports = {
    followUser,
    unfollowUser,
    isFollowing,
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
    getLocalFollowerCount
};
