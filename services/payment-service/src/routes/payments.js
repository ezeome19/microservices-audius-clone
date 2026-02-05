const express = require('express');
const router = express.Router();
const { initializePayment, verifyTransaction, withdrawFunds } = require('../controllers/paymentController');
const { getPlatformWallet } = require('../controllers/walletController');
const { authMiddleware, paymentLimiter, withdrawLimiter } = require('../../../../shared');

// Get platform wallet (no rate limit - read-only)
router.get('/wallet', authMiddleware, getPlatformWallet);

// Initialize payment (rate limited to prevent spam)
router.post('/initialize', authMiddleware, paymentLimiter, initializePayment);

// Withdraw funds (strict rate limit - 3 per hour)
router.post('/withdraw', authMiddleware, withdrawLimiter, withdrawFunds);

// Verify payment (POST from frontend) - rate limited
router.post('/verify', authMiddleware, paymentLimiter, verifyTransaction);

// Callback (GET request from Flutterwave) - no rate limit (Flutterwave controls this)
router.get('/callback', verifyTransaction);

module.exports = router;

