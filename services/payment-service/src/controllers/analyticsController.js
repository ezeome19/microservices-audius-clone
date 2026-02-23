const { ArtistEarnings, CoinTransaction, CoinWallet } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Get artist revenue overview
async function getArtistRevenue(req, res) {
    try {
        const { artistId } = req.params;
        const userId = req.user.id;

        // Verify user owns this artist profile
        // TODO: Add artist ownership check

        const earnings = await ArtistEarnings.findOne({
            where: { artistId }
        });

        if (!earnings) {
            return res.json({
                message: 'No earnings yet',
                revenue: {
                    availableBalance: 0,
                    pendingBalance: 0,
                    lifetimeEarnings: 0,
                    totalWithdrawn: 0
                }
            });
        }

        // Get monthly revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthlyTransactions = await CoinTransaction.findAll({
            where: {
                artistId,
                status: 'completed',
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            attributes: ['type', 'fiatAmount', 'createdAt']
        });

        const monthlyRevenue = monthlyTransactions.reduce((sum, tx) => {
            return sum + (parseFloat(tx.fiatAmount) * 0.90); // 90% to artist
        }, 0);

        res.json({
            message: 'Revenue retrieved successfully',
            revenue: {
                availableBalance: earnings.availableBalance,
                pendingBalance: earnings.pendingBalance,
                lifetimeEarnings: earnings.lifetimeEarnings,
                totalWithdrawn: earnings.totalWithdrawn,
                monthlyRevenue,
                currency: earnings.currency
            }
        });
    } catch (error) {
        console.error('getArtistRevenue ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve revenue' });
    }
}

// Get top supporters
async function getTopSupporters(req, res) {
    try {
        const { artistId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Get users who have spent the most coins on this artist
        const supporters = await CoinWallet.findAll({
            where: { artistId },
            attributes: ['userId', 'lifetimeSpent'],
            order: [['lifetimeSpent', 'DESC']],
            limit
        });

        res.json({
            message: 'Top supporters retrieved',
            supporters
        });
    } catch (error) {
        console.error('getTopSupporters ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve supporters' });
    }
}

// Get transaction history
async function getTransactionHistory(req, res) {
    try {
        const { artistId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: transactions } = await CoinTransaction.findAndCountAll({
            where: {
                artistId,
                status: 'completed'
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            message: 'Transaction history retrieved',
            transactions,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('getTransactionHistory ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
}

// Get revenue breakdown by type
async function getRevenueBreakdown(req, res) {
    try {
        const { artistId } = req.params;

        const transactions = await CoinTransaction.findAll({
            where: {
                artistId,
                status: 'completed'
            },
            attributes: [
                'type',
                [CoinTransaction.sequelize.fn('COUNT', CoinTransaction.sequelize.col('id')), 'count'],
                [CoinTransaction.sequelize.fn('SUM', CoinTransaction.sequelize.col('fiatAmount')), 'total']
            ],
            group: ['type']
        });

        const breakdown = transactions.map(tx => ({
            type: tx.type,
            count: parseInt(tx.dataValues.count),
            total: parseFloat(tx.dataValues.total) * 0.90, // 90% to artist
            artistShare: parseFloat(tx.dataValues.total) * 0.90
        }));

        res.json({
            message: 'Revenue breakdown retrieved',
            breakdown
        });
    } catch (error) {
        console.error('getRevenueBreakdown ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve breakdown' });
    }
}

// Get platform-wide revenue summary (admin only)
async function getPlatformRevenue(req, res) {
    try {
        // Aggregate all artist earnings
        const totalLifetime = await ArtistEarnings.sum('lifetimeEarnings') || 0;
        const totalPending = await ArtistEarnings.sum('pendingBalance') || 0;
        const totalWithdrawn = await ArtistEarnings.sum('totalWithdrawn') || 0;
        const artistCount = await ArtistEarnings.count();

        // Count completed transactions
        const totalTransactions = await CoinTransaction.count({ where: { status: 'completed' } });
        const totalTips = await CoinTransaction.count({ where: { status: 'completed', type: 'tip' } });
        const totalPurchases = await CoinTransaction.count({ where: { status: 'completed', type: 'purchase' } });

        // Last 30 days revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyTxs = await CoinTransaction.findAll({
            where: { status: 'completed', createdAt: { [Op.gte]: thirtyDaysAgo } },
            attributes: [[fn('SUM', col('fiatAmount')), 'total']]
        });
        const monthlyRevenue = parseFloat(monthlyTxs[0]?.dataValues?.total || 0);

        res.json({
            message: 'Platform revenue retrieved',
            revenue: {
                lifetimeEarnings: parseFloat(totalLifetime),
                pendingBalance: parseFloat(totalPending),
                totalWithdrawn: parseFloat(totalWithdrawn),
                monthlyRevenue,
                artistCount,
                totalTransactions,
                totalTips,
                totalPurchases
            }
        });
    } catch (error) {
        console.error('getPlatformRevenue ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve platform revenue' });
    }
}

// Get tip leaderboard — top artists by tips received (admin only)
async function getTipLeaderboard(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const leaderboard = await CoinTransaction.findAll({
            where: { type: 'tip', status: 'completed' },
            attributes: [
                'artistId',
                [fn('COUNT', col('id')), 'tipCount'],
                [fn('SUM', col('fiatAmount')), 'totalAmount'],
                [fn('SUM', col('coinAmount')), 'totalCoins']
            ],
            group: ['artistId'],
            order: [[literal('"totalAmount"'), 'DESC']],
            limit
        });

        res.json({
            message: 'Tip leaderboard retrieved',
            leaderboard: leaderboard.map(row => ({
                artistId: row.artistId,
                tipCount: parseInt(row.dataValues.tipCount),
                totalAmount: parseFloat(row.dataValues.totalAmount || 0),
                totalCoins: parseFloat(row.dataValues.totalCoins || 0)
            }))
        });
    } catch (error) {
        console.error('getTipLeaderboard ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve tip leaderboard' });
    }
}

module.exports = {
    getArtistRevenue,
    getTopSupporters,
    getTransactionHistory,
    getRevenueBreakdown,
    getPlatformRevenue,
    getTipLeaderboard
};
