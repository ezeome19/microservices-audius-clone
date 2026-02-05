const { Subscription, CoinWallet, ArtistCoin, ArtistEarnings } = require('../models');
const { generatePaymentLink, verifyPayment } = require('../services/walletService');
const { withDbTransaction, lockRow, lockRowById, isAlreadyProcessed } = require('../../../../shared');
const { SUBSCRIPTION_TIERS } = require('../constants/subscriptionTiers');

async function initializeSubscription(req, res) {
    try {
        const { tier, artistIds, currency = 'NGN' } = req.body;
        const userId = req.user.id;

        // Validate tier
        const tierConfig = SUBSCRIPTION_TIERS[tier];
        if (!tierConfig) {
            return res.status(400).json({ message: 'Invalid subscription tier' });
        }

        // Validate artist count (only for legacy packs that use artistIds)
        const isStreamingTier = ['daily', 'weekly', 'monthly', 'yearly'].includes(tier);
        if (!isStreamingTier) {
            if (!artistIds || artistIds.length === 0) {
                return res.status(400).json({ message: 'Please select at least one artist' });
            }

            if (artistIds.length > tierConfig.maxArtists) {
                return res.status(400).json({
                    message: `Maximum ${tierConfig.maxArtists} artists allowed for ${tier} tier`
                });
            }

            // Verify all artists have coins
            const artistCoins = await ArtistCoin.findAll({
                where: { artistId: artistIds, isActive: true }
            });

            if (artistCoins.length !== artistIds.length) {
                return res.status(400).json({ message: 'Some artists do not have active coins' });
            }
        }


        const amount = currency === 'NGN' ? tierConfig.priceNGN : tierConfig.priceUSD;

        // Create pending subscription
        const subscription = await Subscription.create({
            userId,
            tier,
            status: 'pending',
            artistCoinsIncluded: artistIds,
            amount,
            currency
        });

        // Generate Flutterwave payment link
        const paymentData = await generatePaymentLink({
            amount,
            currency,
            email: req.user.email,
            tx_ref: subscription.id,
            redirect_url: `${process.env.FRONTEND_URL}/payment/verify?type=subscription`,
            meta: {
                userId,
                subscriptionId: subscription.id,
                tier,
                artistCount: artistIds.length
            }
        });

        // Update subscription with Flutterwave reference
        await subscription.update({ flutterwaveReference: paymentData.tx_ref });

        res.json({
            message: 'Subscription initialized',
            paymentLink: paymentData.link,
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
            reference: subscription.id,
            tier: tierConfig.name,
            amount,
            customer: {
                email: req.user.email,
                name: req.user.name
            }
        });

    } catch (error) {
        console.error('initializeSubscription ERROR:', error);
        res.status(500).json({ message: 'Failed to initialize subscription' });
    }
}

// Verify and activate subscription
async function verifySubscription(req, res) {
    const { withDbTransaction, lockRow, isAlreadyProcessed } = require('../../../../shared');
    const { sequelize, Subscription, CoinWallet, ArtistCoin } = require('../models');

    try {
        const { transaction_id } = req.body;

        if (!transaction_id) {
            return res.status(400).json({ message: 'Transaction ID is required' });
        }

        console.log(`[Payment Service] Verifying subscription: transaction_id=${transaction_id}`);

        // 1. Verify with Flutterwave first to get our tx_ref (subscription.id)
        const paymentVerification = await verifyPayment(transaction_id);

        if (!paymentVerification || paymentVerification.status !== 'successful') {
            throw {
                status: 400,
                message: 'Payment verification failed',
                verificationStatus: paymentVerification?.status || 'failed'
            };
        }

        const txRef = paymentVerification.tx_ref;
        console.log(`[Payment Service] Subscription verified on Flutterwave. Searching for tx_ref: ${txRef}`);

        // 2. Wrap entire operation in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Find and lock subscription row
            const subscription = await Subscription.findOne({
                where: { id: txRef },
                lock: sequelize.Sequelize.Transaction.LOCK.UPDATE,
                transaction
            });

            if (!subscription) {
                console.error(`[Payment Service] Subscription not found for txRef: ${txRef}`);
                throw { status: 404, message: 'Subscription record not found' };
            }

            // Idempotency check
            if (subscription.status === 'active') {
                return {
                    alreadyProcessed: true,
                    message: 'Subscription already active'
                };
            }

            const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

            // Allocate coins to user for each artist (all within transaction)
            for (const artistId of subscription.artistCoinsIncluded) {
                let wallet = await lockRow(CoinWallet,
                    { userId: subscription.userId, artistId },
                    transaction
                );

                if (!wallet) {
                    wallet = await CoinWallet.create({
                        userId: subscription.userId,
                        artistId,
                        balance: 0,
                        lifetimeEarned: 0,
                        lifetimeSpent: 0
                    }, { transaction });
                }

                await wallet.increment({
                    balance: tierConfig.coinsPerArtist,
                    lifetimeEarned: tierConfig.coinsPerArtist
                }, { transaction });

                await wallet.update({ lastTransaction: new Date() }, { transaction });

                // Update circulating supply
                const artistCoin = await lockRow(ArtistCoin, { artistId }, transaction);
                if (artistCoin) {
                    await artistCoin.increment('circulatingSupply', {
                        by: tierConfig.coinsPerArtist,
                        transaction
                    });
                }
            }

            // Add bonus coins to general wallet (can be used for any artist)
            if (tierConfig.bonusCoins && tierConfig.bonusCoins > 0) {
                let bonusWallet = await lockRow(CoinWallet,
                    { userId: subscription.userId, artistId: null },
                    transaction
                );

                if (!bonusWallet) {
                    bonusWallet = await CoinWallet.create({
                        userId: subscription.userId,
                        artistId: null,
                        balance: 0,
                        lifetimeEarned: 0,
                        lifetimeSpent: 0
                    }, { transaction });
                }

                await bonusWallet.increment({
                    balance: tierConfig.bonusCoins,
                    lifetimeEarned: tierConfig.bonusCoins
                }, { transaction });
            }

            // Credit a-tokens for streaming tiers (daily/weekly/monthly/yearly)
            if (tierConfig.aTokens && tierConfig.aTokens > 0) {
                let platformWallet = await lockRow(CoinWallet,
                    { userId: subscription.userId, artistId: null },
                    transaction
                );

                if (!platformWallet) {
                    platformWallet = await CoinWallet.create({
                        userId: subscription.userId,
                        artistId: null,
                        balance: 0,
                        lifetimeEarned: 0,
                        lifetimeSpent: 0
                    }, { transaction });
                }

                await platformWallet.increment({
                    balance: tierConfig.aTokens,
                    lifetimeEarned: tierConfig.aTokens
                }, { transaction });

                await platformWallet.update({ lastTransaction: new Date() }, { transaction });
            }

            // Activate subscription
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (tierConfig.durationDays || 30));

            await subscription.update({
                status: 'active',
                startDate,
                endDate
            }, { transaction });

            return {
                alreadyProcessed: false,
                tier: tierConfig.name,
                coinsAllocated: tierConfig.coinsPerArtist * subscription.artistCoinsIncluded.length,
                bonusCoins: tierConfig.bonusCoins,
                validUntil: endDate
            };
        });

        // Handle result
        if (result.alreadyProcessed) {
            return res.json({ message: result.message });
        }

        res.json({
            status: 'success',
            message: 'Subscription activated successfully',
            tier: result.tier,
            coinsAllocated: result.coinsAllocated,
            bonusCoins: result.bonusCoins,
            validUntil: result.validUntil
        });
    } catch (error) {
        console.error('verifySubscription ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                status: error.verificationStatus
            });
        }

        res.status(500).json({ message: 'Failed to verify subscription' });
    }
}

// Get subscription tiers
async function getSubscriptionTiers(req, res) {
    try {
        const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, config]) => ({
            id: key,
            ...config
        }));

        res.json({
            message: 'Subscription tiers retrieved',
            tiers
        });
    } catch (error) {
        console.error('getSubscriptionTiers ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve tiers' });
    }
}

// Get user's active subscription
async function getUserSubscription(req, res) {
    try {
        const userId = req.user.id;

        const subscription = await Subscription.findOne({
            where: { userId, status: 'active' },
            order: [['createdAt', 'DESC']]
        });

        if (!subscription) {
            return res.json({
                message: 'No active subscription',
                subscription: null
            });
        }

        const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

        res.json({
            message: 'Subscription retrieved',
            subscription: {
                ...subscription.toJSON(),
                tierDetails: tierConfig
            }
        });
    } catch (error) {
        console.error('getUserSubscription ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve subscription' });
    }
}

// Purchase subscription with wallet balance
async function purchaseSubscriptionWithWallet(req, res) {
    const { withDbTransaction, lockRow } = require('../../../../shared');
    const { sequelize, CoinWallet, Subscription } = require('../models');

    try {
        const { tier, currency = 'NGN' } = req.body;
        const userId = req.user.id;

        // Validate tier
        const tierConfig = SUBSCRIPTION_TIERS[tier];
        if (!tierConfig) {
            return res.status(400).json({ message: 'Invalid subscription tier' });
        }

        const amount = currency === 'NGN' ? tierConfig.priceNGN : tierConfig.priceUSD;

        // Wrap entire operation in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Lock wallet row BEFORE checking balance
            const wallet = await lockRow(
                CoinWallet,
                { userId, artistId: null },
                transaction
            );

            if (!wallet) {
                throw { status: 400, message: 'Wallet not found. Please fund your wallet first.' };
            }

            // Check balance in the selected currency (now safe from race conditions)
            const walletBalance = currency === 'NGN' ? wallet.balanceNGN : wallet.balanceUSD;

            if (walletBalance < amount) {
                throw {
                    status: 400,
                    message: 'Insufficient wallet balance',
                    required: amount,
                    available: walletBalance,
                    currency
                };
            }

            // Deduct from wallet
            if (currency === 'NGN') {
                await wallet.decrement('balanceNGN', { by: amount, transaction });
            } else {
                await wallet.decrement('balanceUSD', { by: amount, transaction });
            }

            // Create and activate subscription immediately
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + tierConfig.durationDays);

            const subscription = await Subscription.create({
                userId,
                tier,
                status: 'active',
                startDate,
                endDate,
                amount,
                currency,
                flutterwaveReference: `wallet_${Date.now()}_${userId}`
            }, { transaction });

            // Credit a-tokens if applicable
            if (tierConfig.aTokens && tierConfig.aTokens > 0) {
                await wallet.increment({
                    balance: tierConfig.aTokens,
                    lifetimeEarned: tierConfig.aTokens
                }, { transaction });

                await wallet.update({ lastTransaction: new Date() }, { transaction });
            }

            return {
                subscriptionId: subscription.id,
                tier: tierConfig.name,
                aTokens: tierConfig.aTokens,
                validUntil: endDate,
                newBalance: currency === 'NGN'
                    ? parseFloat(wallet.balanceNGN) - parseFloat(amount)
                    : parseFloat(wallet.balanceUSD) - parseFloat(amount)
            };
        });

        res.json({
            message: 'Subscription activated successfully',
            subscriptionId: result.subscriptionId,
            tier: result.tier,
            aTokens: result.aTokens,
            validUntil: result.validUntil,
            newBalance: result.newBalance
        });
    } catch (error) {
        console.error('subscribeWithWallet ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                required: error.required,
                available: error.available,
                currency: error.currency
            });
        }

        res.status(500).json({ message: 'Failed to subscribe with wallet' });
    }
}

module.exports = {
    initializeSubscription,
    verifySubscription,
    getSubscriptionTiers,
    getUserSubscription,
    purchaseSubscriptionWithWallet,
    SUBSCRIPTION_TIERS
};
