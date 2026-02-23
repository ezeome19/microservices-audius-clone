const _ = require('lodash');
const {
    createMerchant,
    findMerchantById,
    findAllMerchants,
    verifyMerchant,
    unverifyMerchant,
    updateMerchantProfile
} = require('../services/merchantServices');
const { findUserByEmail, verifyPassword } = require('../services/userServices');


// Merchant signup
async function signupMerchant(req, res) {
    const existingUser = await findUserByEmail(req.body.email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already registered with this email' });
    }

    const merchant = await createMerchant(req.body);
    const token = merchant.generateAuthToken();

    res.json({
        message: 'Merchant registered successfully. Awaiting admin verification.',
        user: _.pick(merchant, ['id', 'name', 'email', 'userType', 'artistName', 'recordLabel', 'isVerified']),
        token
    });
}

// Merchant login (reuses standard login logic)
async function loginMerchant(req, res) {
    const user = await findUserByEmail(req.body.email);

    if (!user || user.userType !== 'merchant') {
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
        isVerified: user.isVerified
    });
}

// Get current merchant
async function getCurrentMerchant(req, res) {
    const merchant = await findMerchantById(req.user.id);

    if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
    }

    res.json({
        message: 'Merchant retrieved successfully',
        user: merchant
    });
}

// Update merchant profile
async function updateMerchantProfileController(req, res) {
    const merchant = await updateMerchantProfile(req.user.id, req.body);

    if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
    }

    res.json({
        message: 'Merchant profile updated successfully',
        user: _.pick(merchant, ['id', 'name', 'email', 'artistName', 'recordLabel', 'isVerified'])
    });
}

// Get all merchants (admin only)
async function getAllMerchants(req, res) {
    try {
        const { isVerified } = req.query;
        const filters = {};

        if (isVerified !== undefined) {
            filters.isVerified = isVerified === 'true';
        }

        console.log('[MerchantController] Fetching merchants with filters:', JSON.stringify(filters));
        const merchants = await findAllMerchants(filters);
        console.log('[MerchantController] Found merchants count:', merchants.length);

        res.json({
            message: 'Merchants retrieved successfully',
            count: merchants.length,
            merchants
        });
    } catch (error) {
        console.error('[MerchantController] Error in getAllMerchants:', error);
        res.status(500).json({ message: 'Internal server error while fetching merchants' });
    }
}

// Verify merchant account (admin only)
async function verifyMerchantAccount(req, res) {
    const merchant = await verifyMerchant(req.params.id, req.user.id);

    if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
    }

    res.json({
        message: 'Merchant verified successfully',
        user: _.pick(merchant, ['id', 'name', 'email', 'artistName', 'recordLabel', 'isVerified', 'verifiedAt'])
    });
}

// Unverify merchant account (admin only)
async function unverifyMerchantAccount(req, res) {
    const merchant = await unverifyMerchant(req.params.id, req.user.id);

    if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
    }

    res.json({
        message: 'Merchant verification revoked successfully',
        user: _.pick(merchant, ['id', 'name', 'email', 'artistName', 'recordLabel', 'isVerified'])
    });
}

module.exports = {
    signupMerchant,
    loginMerchant,
    getCurrentMerchant,
    updateMerchantProfileController,
    getAllMerchants,
    verifyMerchantAccount,
    unverifyMerchantAccount
};
