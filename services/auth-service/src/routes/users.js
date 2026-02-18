const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware, validateMiddleware, authLimiter } = require('../../../../shared');
const {
    signupUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    updateProfile,
    forgotPassword,
    resetPassword,
    deleteUser,
    getPreferences,
    updatePreferences,
    upgradeToMerchant
} = require('../controllers/userController');
const {
    validate,
    validateLogin,
    validateProfileUpdate,
    validatePasswordResetRequest,
    validatePasswordReset,
    validatePreferences,
    validateAccountUpgrade
} = require('../models/user');


router.get('/me', authMiddleware, getCurrentUser);
router.get('/me/preferences', authMiddleware, getPreferences);
router.put('/me/preferences', [authMiddleware, validateMiddleware(validatePreferences)], updatePreferences);
router.put('/preferences', [authMiddleware, validateMiddleware(validatePreferences)], updatePreferences); // Alias for artist onboarding
router.get('/:userId', getCurrentUser); // Public endpoint to get user by ID
router.post('/signup', authLimiter, validateMiddleware(validate), signupUser);
router.post('/login', authLimiter, validateMiddleware(validateLogin), loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/forgot-password', authLimiter, validateMiddleware(validatePasswordResetRequest), forgotPassword);
router.post('/reset-password/:token', authLimiter, validateMiddleware(validatePasswordReset), resetPassword);
router.put('/profile', [authMiddleware, validateMiddleware(validateProfileUpdate)], updateProfile);
router.delete('/:id', [authMiddleware, adminMiddleware], deleteUser);
router.post('/upgrade-to-merchant', [authMiddleware, validateMiddleware(validateAccountUpgrade)], upgradeToMerchant);

module.exports = router;