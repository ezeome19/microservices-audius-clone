const { CoinWallet, CoinTransaction, ArtistEarnings, ArtistCoin } = require('../models');
const { generatePaymentLink, verifyPayment } = require('../services/walletService');
const sanitizeHtml = require('sanitize-html');

// Initialize tip to artist
async function initializeTip(req, res) {
    try {
        const { artistId } = req.params;
        const { amount, currency = 'NGN', message } = req.body;
        const userId = req.user.id;

        console.log(`[Payment Service] initializeTip: artistId=${artistId}, amount=${amount}, currency=${currency}, userId=${userId}`);

        // Sanitize message to prevent XSS
        const sanitizedMessage = message ? sanitizeHtml(message, {
            allowedTags: [],
            allowedAttributes: {}
        }) : null;

        const minAmount = currency === 'NGN' ? 10 : 0.10;
        if (!amount || amount < minAmount) {
            const minLabel = currency === 'NGN' ? '₦10' : '$0.10';
            return res.status(400).json({ message: `Minimum tip amount is ${minLabel}` });
        }

        // For now, use a 1:1 ratio for coinAmount since we are just tracking fiat tips
        // The user handles conversion/payout later
        const coinAmount = parseFloat(amount).toFixed(2);

        // Create pending transaction
        const transaction = await CoinTransaction.create({
            userId,
            artistId,
            type: 'tip',
            coinAmount,
            fiatAmount: amount,
            currency,
            status: 'pending',
            metadata: { message: sanitizedMessage },
            description: `Tip to artist (${currency} ${amount})`
        });

        // Generate Flutterwave payment link
        const paymentData = await generatePaymentLink({
            amount,
            currency,
            email: req.user.email || 'user@example.com',
            name: req.user.name || 'Audius User',
            tx_ref: transaction.id,
            redirect_url: `${process.env.FRONTEND_URL}/payment/verify?type=tip`,
            meta: {
                userId,
                artistId,
                transactionId: transaction.id,
                type: 'tip'
            }
        });

        // Update transaction with Flutterwave reference
        await transaction.update({ flutterwaveReference: paymentData.tx_ref });

        res.json({
            message: 'Tip initialized',
            paymentLink: paymentData.link,
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: transaction.id,
            amount: transaction.fiatAmount,
            currency: transaction.currency,
            customer: {
                email: req.user.email || 'user@example.com',
                name: req.user.name || 'Audius User'
            },
            reference: transaction.id,
            coinAmount,
            amount
        });
    } catch (error) {
        console.error('initializeTip ERROR:', error);
        res.status(500).json({ message: 'Failed to initialize tip' });
    }
}

// Verify tip payment
async function verifyTip(req, res) {
    const { withDbTransaction, lockRow, isAlreadyProcessed } = require('../../../../shared');
    const { sequelize, CoinTransaction, ArtistEarnings } = require('../models');

    try {
        const { transaction_id } = req.body;

        if (!transaction_id) {
            return res.status(400).json({ message: 'Transaction ID is required' });
        }

        console.log(`[Payment Service] Verifying tip: transaction_id=${transaction_id}`);

        // 1. Verify with Flutterwave first to get our tx_ref
        const paymentVerification = await verifyPayment(transaction_id);

        if (!paymentVerification || paymentVerification.status !== 'successful') {
            throw {
                status: 400,
                message: 'Payment verification failed',
                verificationStatus: paymentVerification?.status || 'failed'
            };
        }

        const txRef = paymentVerification.tx_ref;
        console.log(`[Payment Service] Tip verified on Flutterwave. Searching for tx_ref: ${txRef}`);

        // 2. Wrap database updates in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Find the transaction by its reference (not ID, as tx_ref is the transaction.id from initialize)
            const txn = await CoinTransaction.findOne({
                where: { id: txRef },
                lock: sequelize.Sequelize.Transaction.LOCK.UPDATE,
                transaction
            });

            if (!txn) {
                console.error(`[Payment Service] CoinTransaction not found for txRef: ${txRef}`);
                throw { status: 404, message: 'Transaction record not found' };
            }

            // Idempotency check
            if (txn.status === 'completed') {
                return {
                    alreadyProcessed: true,
                    message: 'Tip already processed'
                };
            }

            // Calculate platform fee (10%) and artist share (90%)
            const platformFee = parseFloat(txn.fiatAmount) * 0.10;
            const artistShare = parseFloat(txn.fiatAmount) * 0.90;

            // Credit artist earnings (all within transaction)
            let earnings = await lockRow(ArtistEarnings,
                { artistId: txn.artistId },
                transaction
            );

            if (!earnings) {
                earnings = await ArtistEarnings.create({
                    artistId: txn.artistId,
                    availableBalance: 0,
                    pendingBalance: 0,
                    lifetimeEarnings: 0,
                    currency: txn.currency
                }, { transaction });
            }

            // Tips go to pending balance (7-day hold)
            await earnings.increment({
                pendingBalance: artistShare,
                lifetimeEarnings: artistShare
            }, { transaction });

            // Mark transaction as completed
            await txn.update({ status: 'completed' }, { transaction });

            return {
                alreadyProcessed: false,
                artistReceived: artistShare,
                platformFee,
                coinAmount: txn.coinAmount,
                artistId: txn.artistId
            };
        });

        // Handle result
        if (result.alreadyProcessed) {
            return res.json({ message: result.message });
        }

        res.json({
            status: 'success',
            message: 'Tip sent successfully',
            artistReceived: result.artistReceived,
            platformFee: result.platformFee,
            coinAmount: result.coinAmount,
            artistId: result.artistId
        });
    } catch (error) {
        console.error('verifyTip ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                status: error.verificationStatus
            });
        }

        res.status(500).json({ message: 'Failed to verify tip' });
    }
}

// Spend coins to unlock content
async function spendCoins(req, res) {
    const { withDbTransaction, lockRow } = require('../../../../shared');
    const { sequelize, CoinWallet, CoinTransaction, ArtistCoin, ArtistEarnings } = require('../models');

    try {
        const { artistId, contentId, contentType, coinAmount } = req.body;
        const userId = req.user.id;

        // Wrap entire operation in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Lock wallet row BEFORE checking balance (prevents race conditions)
            const wallet = await lockRow(
                CoinWallet,
                { userId, artistId },
                transaction
            );

            // Check balance (now safe from concurrent modifications)
            if (!wallet || parseFloat(wallet.balance) < parseFloat(coinAmount)) {
                throw {
                    status: 402,
                    message: 'Insufficient coins',
                    required: coinAmount,
                    current: wallet ? wallet.balance : 0
                };
            }

            // Deduct coins
            await wallet.decrement('balance', { by: coinAmount, transaction });
            await wallet.increment('lifetimeSpent', { by: coinAmount, transaction });
            await wallet.update({ lastTransaction: new Date() }, { transaction });

            // Record transaction
            await CoinTransaction.create({
                userId,
                artistId,
                type: 'spend',
                coinAmount,
                fiatAmount: null,
                status: 'completed',
                metadata: { contentId, contentType },
                description: `Unlocked ${contentType}`
            }, { transaction });

            // Calculate artist earnings (coins × price × 90%)
            const artistCoin = await ArtistCoin.findOne({
                where: { artistId },
                transaction
            });

            const fiatValue = parseFloat(coinAmount) * parseFloat(artistCoin.pricePerCoin);
            const artistShare = fiatValue * 0.90;

            // Credit artist
            let earnings = await lockRow(ArtistEarnings, { artistId }, transaction);
            if (!earnings) {
                earnings = await ArtistEarnings.create({
                    artistId,
                    availableBalance: 0,
                    pendingBalance: 0,
                    lifetimeEarnings: 0
                }, { transaction });
            }

            await earnings.increment({
                availableBalance: artistShare, // Coin spending goes to available balance immediately
                lifetimeEarnings: artistShare
            }, { transaction });

            return {
                coinsSpent: coinAmount,
                newBalance: parseFloat(wallet.balance) - parseFloat(coinAmount)
            };
        });

        res.json({
            message: 'Content unlocked successfully',
            coinsSpent: result.coinsSpent,
            newBalance: result.newBalance
        });
    } catch (error) {
        console.error('spendCoins ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                required: error.required,
                current: error.current
            });
        }

        res.status(500).json({ message: 'Failed to spend coins' });
    }
}

module.exports = {
    initializeTip,
    verifyTip,
    spendCoins
};
