const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    initializeCoinPurchase,
    verifyCoinPurchase,
    getUserWallets,
    getCoinPackages
} = require('../controllers/coinController');

// Get coin packages for an artist
router.get('/packages/:artistId', authMiddleware, getCoinPackages);

// Initialize coin purchase
router.post('/purchase', authMiddleware, initializeCoinPurchase);

// Verify coin purchase
router.post('/verify', authMiddleware, verifyCoinPurchase);

// Get user's coin wallets
router.get('/wallets', authMiddleware, getUserWallets);

module.exports = router;
