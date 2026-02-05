const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { CoinTransaction, CoinWallet, ArtistCoin, Subscription, sequelize } = require('../models');
const { logger, withDbTransaction, lockRow } = require('../../../../shared');

// Flutterwave Webhook Handler
router.post('/flutterwave', async (req, res) => {
    try {
        // Verify webhook signature
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            logger.warn('Invalid webhook signature');
            return res.status(401).end();
        }

        const payload = req.body;
        logger.info('Flutterwave webhook received:', payload.event);

        // Handle different event types
        if (payload.event === 'charge.completed') {
            if (payload.data.status === 'successful') {
                await handleSuccessfulPayment(payload.data);
            }
        }

        res.status(200).end();
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).end();
    }
});

async function handleSuccessfulPayment(data) {
    const { tx_ref, amount, currency, customer } = data;

    try {
        await withDbTransaction(sequelize, async (dbTransaction) => {
            // Find transaction by reference and lock it
            const transactionRecord = await CoinTransaction.findOne({
                where: { flutterwaveReference: tx_ref },
                lock: true,
                transaction: dbTransaction
            });

            if (!transactionRecord) {
                // Check if it's a subscription and lock it
                const subscription = await Subscription.findOne({
                    where: { flutterwaveReference: tx_ref },
                    lock: true,
                    transaction: dbTransaction
                });

                if (subscription) {
                    return await processSubscription(subscription, dbTransaction);
                }

                logger.warn(`Transaction not found for ref: ${tx_ref}`);
                return;
            }

            // Prevent double processing
            if (transactionRecord.status === 'completed') {
                logger.info(`Transaction ${tx_ref} already processed`);
                return;
            }

            // Verify amount matches
            if (parseFloat(transactionRecord.fiatAmount) !== parseFloat(amount)) {
                logger.error(`Amount mismatch for ${tx_ref}`);
                await transactionRecord.update({ status: 'failed' }, { transaction: dbTransaction });
                return;
            }

            // Process based on transaction type
            switch (transactionRecord.type) {
                case 'purchase':
                    await processCoinPurchase(transactionRecord, dbTransaction);
                    break;
                case 'tip':
                    await processTip(transactionRecord, dbTransaction);
                    break;
                default:
                    logger.warn(`Unknown transaction type: ${transactionRecord.type}`);
            }
        });
    } catch (error) {
        logger.error('Payment processing error:', error);
        throw error;
    }
}

async function processCoinPurchase(transactionRecord, dbTransaction) {
    // Credit coins to user wallet - Use lockRow to prevent concurrent balance updates
    let wallet = await lockRow(CoinWallet,
        { userId: transactionRecord.userId, artistId: transactionRecord.artistId },
        dbTransaction
    );

    if (!wallet) {
        wallet = await CoinWallet.create({
            userId: transactionRecord.userId,
            artistId: transactionRecord.artistId,
            balance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0
        }, { transaction: dbTransaction });
    }

    await wallet.increment({
        balance: transactionRecord.coinAmount,
        lifetimeEarned: transactionRecord.coinAmount
    }, { transaction: dbTransaction });

    await wallet.update({ lastTransaction: new Date() }, { transaction: dbTransaction });

    // Update circulating supply - Lock the artist coin record too
    const artistCoin = await lockRow(ArtistCoin,
        { artistId: transactionRecord.artistId },
        dbTransaction
    );

    if (artistCoin) {
        await artistCoin.increment('circulatingSupply', {
            by: transactionRecord.coinAmount,
            transaction: dbTransaction
        });
    }

    // Mark transaction as completed
    await transactionRecord.update({ status: 'completed' }, { transaction: dbTransaction });

    logger.info(`Coins credited: ${transactionRecord.coinAmount} to user ${transactionRecord.userId}`);
}

async function processTip(transactionRecord, dbTransaction) {
    const { ArtistEarnings } = require('../models');

    // Calculate artist share (90%)
    const artistShare = parseFloat(transactionRecord.fiatAmount) * 0.90;

    // Credit artist earnings - Lock the earnings row
    let earnings = await lockRow(ArtistEarnings,
        { artistId: transactionRecord.artistId },
        dbTransaction
    );

    if (!earnings) {
        earnings = await ArtistEarnings.create({
            artistId: transactionRecord.artistId,
            availableBalance: 0,
            pendingBalance: 0,
            lifetimeEarnings: 0,
            currency: transactionRecord.currency
        }, { transaction: dbTransaction });
    }

    // Tips go to pending balance (7-day hold)
    await earnings.increment({
        pendingBalance: artistShare,
        lifetimeEarnings: artistShare
    }, { transaction: dbTransaction });

    // Mark transaction as completed
    await transactionRecord.update({ status: 'completed' }, { transaction: dbTransaction });

    logger.info(`Tip processed: ${artistShare} to artist ${transactionRecord.artistId}`);
}

async function processSubscription(subscription, dbTransaction) {
    const { CoinWallet, ArtistCoin } = require('../models');
    const { SUBSCRIPTION_TIERS } = require('../controllers/subscriptionController');

    const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

    // Allocate coins to user for each artist
    for (const artistId of subscription.artistCoinsIncluded) {
        let wallet = await lockRow(CoinWallet,
            { userId: subscription.userId, artistId },
            dbTransaction
        );

        if (!wallet) {
            wallet = await CoinWallet.create({
                userId: subscription.userId,
                artistId,
                balance: 0,
                lifetimeEarned: 0,
                lifetimeSpent: 0
            }, { transaction: dbTransaction });
        }

        await wallet.increment({
            balance: tierConfig.coinsPerArtist,
            lifetimeEarned: tierConfig.coinsPerArtist
        }, { transaction: dbTransaction });

        const artistCoin = await lockRow(ArtistCoin, { artistId }, dbTransaction);
        if (artistCoin) {
            await artistCoin.increment('circulatingSupply', {
                by: tierConfig.coinsPerArtist,
                transaction: dbTransaction
            });
        }
    }

    // Add bonus coins
    if (tierConfig.bonusCoins > 0) {
        let bonusWallet = await lockRow(CoinWallet,
            { userId: subscription.userId, artistId: null },
            dbTransaction
        );

        if (!bonusWallet) {
            bonusWallet = await CoinWallet.create({
                userId: subscription.userId,
                artistId: null,
                balance: 0,
                lifetimeEarned: 0,
                lifetimeSpent: 0
            }, { transaction: dbTransaction });
        }

        await bonusWallet.increment({
            balance: tierConfig.bonusCoins,
            lifetimeEarned: tierConfig.bonusCoins
        }, { transaction: dbTransaction });
    }

    // Activate subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await subscription.update({
        status: 'active',
        startDate,
        endDate
    }, { transaction: dbTransaction });

    logger.info(`Subscription activated for user ${subscription.userId}`);
}

module.exports = router;
