const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    getArtistRevenue,
    getTopSupporters,
    getTransactionHistory,
    getRevenueBreakdown
} = require('../controllers/analyticsController');

// Get artist revenue overview
router.get('/artist/:artistId/revenue', authMiddleware, getArtistRevenue);

// Get top supporters
router.get('/artist/:artistId/supporters', authMiddleware, getTopSupporters);

// Get transaction history
router.get('/artist/:artistId/transactions', authMiddleware, getTransactionHistory);

// Get revenue breakdown by type
router.get('/artist/:artistId/breakdown', authMiddleware, getRevenueBreakdown);

module.exports = router;
