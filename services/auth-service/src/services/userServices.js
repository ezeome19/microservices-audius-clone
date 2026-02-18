const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models');


// Get current user
async function findCurrentUser(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (user) {
        console.log(`[Auth Service] User ${userId} preferredArtists:`, user.preferredArtists);
    }
    return user;
}

// Find user by email
async function findUserByEmail(email) {
    return await User.findOne({ where: { email } });
}

// Create new user
async function createUser(userData) {
    const { name, email, password, userType = 'consumer', age, gender, nationality } = userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await User.create({
        name,
        email,
        password: hashedPassword,
        userType,
        age: age || null,
        gender: gender || null,
        nationality: nationality || null
    });
}

// Verify user password
async function verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// Update user profile
async function updateUserProfile(userId, profileData) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    if (profileData.name !== undefined) user.name = profileData.name;
    if (profileData.email !== undefined) user.email = profileData.email;
    if (profileData.bio !== undefined) user.bio = profileData.bio;
    if (profileData.location !== undefined) user.location = profileData.location;
    if (profileData.website !== undefined) user.website = profileData.website;
    if (profileData.twitter !== undefined) user.twitter = profileData.twitter;
    if (profileData.instagram !== undefined) user.instagram = profileData.instagram;
    if (profileData.profilePicture !== undefined) user.profilePicture = profileData.profilePicture;
    if (profileData.coverPhoto !== undefined) user.coverPhoto = profileData.coverPhoto;
    if (profileData.artistName !== undefined) user.artistName = profileData.artistName;
    if (profileData.recordLabel !== undefined) user.recordLabel = profileData.recordLabel;
    if (profileData.age !== undefined) user.age = profileData.age;
    if (profileData.gender !== undefined) user.gender = profileData.gender;
    if (profileData.nationality !== undefined) user.nationality = profileData.nationality;

    await user.save();

    return user;
}

// Request password reset
async function requestPasswordReset(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return null;

    user.verificationToken = user.generateToken();
    user.verificationTokenExpiry = user.getTokenExpiry();
    await user.save();

    return user;
}

// Reset password with token
async function resetPasswordWithToken(token, newPassword) {
    const user = await User.findOne({
        where: {
            verificationToken: token,
            verificationTokenExpiry: { [Op.gt]: new Date() }
        }
    });

    if (!user) return null;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    user.isEmailVerified = true;

    await user.save();
    return user;
}

// Delete user (no related data in auth service)
async function deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    await user.destroy();
    return user;
}

// Get user preferences
async function getUserPreferences(userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'preferences'] });
    if (!user) return null;
    return user.preferences;
}

// Update user preferences
async function updateUserPreferences(userId, preferences) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    // Handle preferredArtists separately (it's a direct column, not in preferences JSON)
    if (preferences.preferredArtists !== undefined) {
        user.preferredArtists = preferences.preferredArtists;
    }

    // Update other preferences in JSON field
    const { preferredArtists, ...otherPreferences } = preferences;
    if (Object.keys(otherPreferences).length > 0) {
        user.preferences = { ...user.preferences, ...otherPreferences };
    }

    await user.save();
    return { ...user.preferences, preferredArtists: user.preferredArtists };
}


// Upgrade user to merchant account
async function upgradeUserToMerchant(userId, upgradeData) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    // Check if user is already a merchant
    if (user.userType === 'merchant') {
        throw new Error('User is already a merchant');
    }

    // Update user to merchant
    user.userType = 'merchant';
    user.artistName = upgradeData.artistName || null;
    user.recordLabel = upgradeData.recordLabel || null;
    user.bio = upgradeData.bio || user.bio;
    user.website = upgradeData.website || user.website;
    user.isVerified = false; // Requires admin verification
    user.upgradedAt = new Date();

    await user.save();
    return user;
}

module.exports = {
    findCurrentUser,
    findUserByEmail,
    createUser,
    verifyPassword,
    updateUserProfile,
    requestPasswordReset,
    resetPasswordWithToken,
    deleteUser,
    getUserPreferences,
    updateUserPreferences,
    upgradeUserToMerchant
};
