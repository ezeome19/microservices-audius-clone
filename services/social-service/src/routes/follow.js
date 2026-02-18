const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    follow,
    unfollow,
    getFollowers,
    getFollowing,
    getActivity
} = require('../controllers/socialController');

// Follow a user
router.post('/follow/:userId', authMiddleware, follow);

// Unfollow a user
router.delete('/follow/:userId', authMiddleware, unfollow);

// Get followers
router.get('/followers', authMiddleware, getFollowers);

// Get following
router.get('/following', authMiddleware, getFollowing);

// Get activity feed
router.get('/activity', authMiddleware, getActivity);

module.exports = router;
