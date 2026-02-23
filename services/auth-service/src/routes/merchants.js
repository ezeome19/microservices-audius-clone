const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware, merchantMiddleware, validateMiddleware, authLimiter } = require('../../../../shared');
const {
    signupMerchant,
    loginMerchant,
    getCurrentMerchant,
    updateMerchantProfileController,
    getAllMerchants,
    verifyMerchantAccount,
    unverifyMerchantAccount
} = require('../controllers/merchantController');
const {
    validateMerchantSignup,
    validateLogin,
    validateProfileUpdate
} = require('../models/user');

// Rate-limited authentication endpoints (prevent brute force)
router.post('/signup', authLimiter, validateMiddleware(validateMerchantSignup), signupMerchant);
router.post('/login', authLimiter, validateMiddleware(validateLogin), loginMerchant);
router.get('/me', [authMiddleware, merchantMiddleware], getCurrentMerchant);
router.put('/profile', [authMiddleware, merchantMiddleware, validateMiddleware(validateProfileUpdate)], updateMerchantProfileController);
// Admin-only routes
router.get('/', [authMiddleware, adminMiddleware], getAllMerchants);
router.post('/:id/verify', [authMiddleware, adminMiddleware], verifyMerchantAccount);
router.post('/:id/unverify', [authMiddleware, adminMiddleware], unverifyMerchantAccount);

module.exports = router;