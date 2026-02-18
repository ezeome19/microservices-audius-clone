const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    getRecommendations,
    getTrending,
    getSimilarSongs,
    getNotifications
} = require('../controllers/recommendationController');

// Get personalized recommendations for dashboard
router.get('/dashboard', authMiddleware, getRecommendations);

// Get notifications
router.get('/notifications', authMiddleware, getNotifications);

// Get trending songs
router.get('/trending', authMiddleware, getTrending);

// Get similar songs
router.get('/similar/:songId', authMiddleware, getSimilarSongs);

module.exports = router;
