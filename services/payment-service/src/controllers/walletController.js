const { CoinWallet, CoinTransaction, Subscription } = require('../models');
const { Op } = require('sequelize');

/**
 * Get the platform (a-token) wallet for the current user
 */
async function getPlatformWallet(req, res) {
    try {
        const userId = req.user.id;

        // Find or create platform wallet (artistId is null)
        const [wallet] = await CoinWallet.findOrCreate({
            where: { userId, artistId: null },
            defaults: { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 }
        });

        // Find active subscription
        const activeSub = await Subscription.findOne({
            where: {
                userId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'DESC']]
        });

        const userTier = activeSub ? activeSub.tier : 'free';

        // Get last 10 transactions
        const transactions = await CoinTransaction.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({
            message: 'Wallet retrieved successfully',
            balance: wallet.balance,
            balanceUSD: wallet.balanceUSD,
            balanceNGN: wallet.balanceNGN,
            lifetimeEarned: wallet.lifetimeEarned,
            lifetimeSpent: wallet.lifetimeSpent,
            tier: userTier,
            transactions
        });
    } catch (error) {
        console.error('getPlatformWallet ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve wallet' });
    }
}

module.exports = {
    getPlatformWallet
};
