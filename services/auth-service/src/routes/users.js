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
    upgradeToMerchant,
    getAllUsers,
    changeUserRole,
    adminVerifyEmail
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

// Admin routes — MUST be above /:userId to prevent the catch-all from intercepting
router.get('/users', [authMiddleware, adminMiddleware], getAllUsers);
router.get('/', [authMiddleware, adminMiddleware], getAllUsers);
router.delete('/:id', [authMiddleware, adminMiddleware], deleteUser);
router.put('/:id/role', [authMiddleware, adminMiddleware], changeUserRole);
router.post('/:id/verify-email', [authMiddleware, adminMiddleware], adminVerifyEmail);

router.get('/:userId', getCurrentUser); // Public endpoint to get user by ID
router.post('/signup', authLimiter, validateMiddleware(validate), signupUser);
router.post('/login', authLimiter, validateMiddleware(validateLogin), loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/forgot-password', authLimiter, validateMiddleware(validatePasswordResetRequest), forgotPassword);
router.post('/reset-password/:token', authLimiter, validateMiddleware(validatePasswordReset), resetPassword);
router.put('/profile', [authMiddleware, validateMiddleware(validateProfileUpdate)], updateProfile);
router.post('/upgrade-to-merchant', [authMiddleware, validateMiddleware(validateAccountUpgrade)], upgradeToMerchant);

module.exports = router;