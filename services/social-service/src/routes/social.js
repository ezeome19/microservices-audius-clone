const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, validateMiddleware } = require('../../../../shared');
const { validate: validateComment, validateUpdate: validateCommentUpdate } = require('../models/comment');
const {
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
} = require('../controllers/socialController');

// Stats routes
router.get('/stats/:artistId', getArtistStats);
router.get('/stats/song/:songId', getSongStats);

// Follow routes
router.post('/follow/:userId', authMiddleware, follow);
router.delete('/follow/:userId', authMiddleware, unfollow);
router.get('/follow/status/:userId', authMiddleware, checkFollowStatus);
router.get('/followers', authMiddleware, getFollowers);
router.get('/following', authMiddleware, getFollowing);

// Repost routes
router.post('/repost/:songId', authMiddleware, repost);
router.post('/reposts/:songId', authMiddleware, repost); // Alias for frontend compatibility
router.delete('/repost/:songId', authMiddleware, removeRepost);
router.get('/reposts', authMiddleware, getReposts);

// Comment routes
router.post('/comment/:songId', [authMiddleware, validateMiddleware(validateComment)], createComment);
router.post('/comments/:songId', [authMiddleware, validateMiddleware(validateComment)], createComment); // Alias for frontend compatibility
router.put('/comment/:commentId', [authMiddleware, validateMiddleware(validateCommentUpdate)], editComment);
router.delete('/comment/:commentId', authMiddleware, removeComment);
router.get('/comments/:songId', optionalAuthMiddleware, getComments);

// Like routes
router.post('/like/:songId', authMiddleware, like);
router.post('/like/comment/:commentId', authMiddleware, like);
router.delete('/like/:songId', authMiddleware, unlike);
router.delete('/like/comment/:commentId', authMiddleware, unlike);
router.get('/likes', authMiddleware, getLikes);

// Activity feed
router.get('/feed', authMiddleware, getActivity);

module.exports = router;
