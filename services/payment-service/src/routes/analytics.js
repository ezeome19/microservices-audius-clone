const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../../../../shared');
const {
    getArtistRevenue,
    getTopSupporters,
    getTransactionHistory,
    getRevenueBreakdown,
    getPlatformRevenue,
    getTipLeaderboard
} = require('../controllers/analyticsController');

// Platform-wide admin analytics
router.get('/platform/revenue', [authMiddleware, adminMiddleware], getPlatformRevenue);
router.get('/platform/tips', [authMiddleware, adminMiddleware], getTipLeaderboard);

// Get artist revenue overview
router.get('/artist/:artistId/revenue', authMiddleware, getArtistRevenue);

// Get top supporters
router.get('/artist/:artistId/supporters', authMiddleware, getTopSupporters);

// Get transaction history
router.get('/artist/:artistId/transactions', authMiddleware, getTransactionHistory);

// Get revenue breakdown by type
router.get('/artist/:artistId/breakdown', authMiddleware, getRevenueBreakdown);

module.exports = router;
