const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    initializeSubscription,
    verifySubscription,
    getSubscriptionTiers,
    getUserSubscription,
    purchaseSubscriptionWithWallet
} = require('../controllers/subscriptionController');

// Get subscription tiers
router.get('/tiers', getSubscriptionTiers);

// Initialize subscription
router.post('/subscribe', authMiddleware, initializeSubscription);

// Verify subscription payment
router.post('/verify', authMiddleware, verifySubscription);

// Get user's active subscription
router.get('/my-subscription', authMiddleware, getUserSubscription);

// Purchase subscription with wallet balance
router.post('/wallet-purchase', authMiddleware, purchaseSubscriptionWithWallet);

module.exports = router;
