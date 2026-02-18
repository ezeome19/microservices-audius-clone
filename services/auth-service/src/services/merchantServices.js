const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models');


// Create new merchant
async function createMerchant(merchantData) {
    const { name, email, password, artistName, recordLabel } = merchantData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await User.create({
        name,
        email,
        password: hashedPassword,
        userType: 'merchant',
        artistName,
        recordLabel,
        isVerified: false
    });
}

// Find merchant by ID
async function findMerchantById(merchantId) {
    return await User.findOne({
        where: { id: merchantId, userType: 'merchant' },
        attributes: { exclude: ['password'] }
    });
}

// Find all merchants with optional filters
async function findAllMerchants(filters = {}) {
    const where = { userType: 'merchant' };

    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }

    return await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
    });
}

// Verify merchant account (admin action)
async function verifyMerchant(merchantId, adminId) {
    const merchant = await User.findOne({
        where: { id: merchantId, userType: 'merchant' }
    });

    if (!merchant) return null;

    merchant.isVerified = true;
    merchant.verifiedBy = adminId;
    merchant.verifiedAt = new Date();
    await merchant.save();

    return merchant;
}

// Unverify merchant account (admin action)
async function unverifyMerchant(merchantId, adminId) {
    const merchant = await User.findOne({
        where: { id: merchantId, userType: 'merchant' }
    });

    if (!merchant) return null;

    merchant.isVerified = false;
    merchant.verifiedBy = null;
    merchant.verifiedAt = null;
    await merchant.save();

    return merchant;
}

// Update merchant profile
async function updateMerchantProfile(merchantId, profileData) {
    const merchant = await User.findOne({
        where: { id: merchantId, userType: 'merchant' }
    });

    if (!merchant) return null;

    merchant.name = profileData.name;
    merchant.email = profileData.email;
    if (profileData.artistName) merchant.artistName = profileData.artistName;
    if (profileData.recordLabel) merchant.recordLabel = profileData.recordLabel;
    await merchant.save();

    return merchant;
}

module.exports = {
    createMerchant,
    findMerchantById,
    findAllMerchants,
    verifyMerchant,
    unverifyMerchant,
    updateMerchantProfile
};
