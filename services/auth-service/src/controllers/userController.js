const _ = require('lodash');
const logger = require('../../../../shared/utils/logger');
const {
    findCurrentUser,
    findUserByEmail,
    createUser,
    verifyPassword,
    updateUserProfile,
    requestPasswordReset,
    resetPasswordWithToken,
    deleteUser: deleteUserService,
    updateUserPreferences,
    upgradeUserToMerchant,
    findAllUsers
} = require('../services/userServices');

// User signup
async function signupUser(req, res) {
    const existingUser = await findUserByEmail(req.body.email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already registered with this email' });
    }
    const user = await createUser({ ...req.body, userType: 'consumer' });
    const token = user.generateAuthToken();
    res.json({
        message: 'User registered successfully',
        user: _.pick(user, ['id', 'name', 'email', 'isAdmin', 'userType']),
        token
    });
}

// User login
async function loginUser(req, res) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    const validPassword = await verifyPassword(req.body.password, user.password);
    if (!validPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = user.generateAuthToken();
    res.json({
        message: 'Login successful',
        token,
        user: _.pick(user, ['id', 'name', 'email', 'isAdmin', 'userType'])
    });
}

// User logout
async function logoutUser(req, res) {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint exists for consistency and future server-side session management
    res.json({
        message: 'Logout successful'
    });
}

// Get current user (authenticated) or user by ID (public)
async function getCurrentUser(req, res) {
    // Use userId from params if available (public access), otherwise use authenticated user ID
    const userId = req.params.userId || req.user?.id;

    if (!userId) { return res.status(400).json({ message: 'User ID is required' }); }

    // Validate UUID format to prevent 500 error from DB
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await findCurrentUser(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({
        message: 'User retrieved successfully',
        user
    });

}

// Update user profile
async function updateProfile(req, res) {
    const user = await updateUserProfile(req.user.id, req.body);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json({
        message: 'Profile updated successfully',
        user: _.pick(user, ['id', 'name', 'email'])
    });
}

// Forgot password
async function forgotPassword(req, res) {
    const user = await requestPasswordReset(req.body.email);

    if (!user) {
        return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // TODO: Send password reset email
    // await sendPasswordResetEmail(user.email, user.verificationToken);

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
}

// Reset password
async function resetPassword(req, res) {
    const user = await resetPasswordWithToken(req.params.token, req.body.password);

    if (!user) {
        return res.status(400).json({ message: 'Bad request | Invalid or expired verification token' });
    }

    res.json({
        message: 'Password reset successfully',
        user: _.pick(user, ['id', 'email'])
    });
}

// Delete user (admin only)
async function deleteUser(req, res) {
    const user = await findCurrentUser(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    await deleteUserService(req.params.id);
    res.json({
        message: 'User deleted successfully',
        user: _.pick(user, ['id', 'email'])
    });
}

// Get user preferences (consumer only)
async function getPreferences(req, res) {
    // Check if user is a consumer
    if (req.user.userType !== 'consumer') {
        return res.status(403).json({ message: 'Only consumer users can access preferences' });
    }

    const preferences = await getUserPreferences(req.user.id);
    res.json({
        message: 'Preferences retrieved successfully',
        preferences: preferences || {}
    });
}

// Update user preferences (consumer only)
async function updatePreferences(req, res) {
    // Check if user is a consumer
    if (req.user.userType !== 'consumer') {
        return res.status(403).json({ message: 'Only consumer users can update preferences' });
    }

    const preferences = await updateUserPreferences(req.user.id, req.body);
    res.json({
        message: 'Preferences updated successfully',
        preferences
    });
}

// Upgrade user to merchant account
async function upgradeToMerchant(req, res) {
    try {
        const user = await upgradeUserToMerchant(req.user.id, req.body);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new token with updated userType
        const token = user.generateAuthToken();

        res.json({
            message: 'Account upgraded to merchant successfully. Pending admin verification.',
            user: _.pick(user, ['id', 'name', 'email', 'userType', 'artistName', 'recordLabel', 'isVerified', 'upgradedAt']),
            token
        });
    } catch (error) {
        if (error.message === 'User is already a merchant') {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
}

// Admin only: Get all users
async function getAllUsers(req, res) {
    const users = await findAllUsers();
    res.json({
        message: 'Users retrieved successfully',
        count: users.length,
        users
    });
}

module.exports = {
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
    getAllUsers
};
