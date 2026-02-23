const axios = require('axios');
const { Sequelize } = require('sequelize');
const { generatePaymentLink, verifyPayment } = require('../services/walletService');
const { logger, withDbTransaction, lockRow } = require('../../../../shared');

const { Transaction, sequelize, CoinWallet, CoinTransaction } = require('../models');

// Initialize Payment
async function initializePayment(req, res) {
    try {
        const { amount, currency } = req.body;

        // Audit #7: Robust Amount Validation
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        if (amount > 1000000) { // Max 1M NGN
            return res.status(400).json({ message: 'Amount exceeds maximum allowed limit (1,000,000)' });
        }

        // Limit decimal places to 2
        const roundedAmount = Math.round(amount * 100) / 100;
        if (roundedAmount !== parseFloat(amount)) {
            return res.status(400).json({ message: 'Amount has too many decimal places (max 2)' });
        }

        const userPayload = req.user; // From auth middleware (minimal data)

        // Fetch full user details from auth service
        const authUrl = `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/${userPayload.id}`;
        const userRes = await axios.get(authUrl);
        const user = userRes.data.user;

        if (!user || !user.email) {
            return res.status(400).json({ message: 'User email is required for payment' });
        }

        const tx_ref = `txn_${Date.now()}_${user.id}`;

        // Log pending transaction
        await Transaction.create({
            userId: user.id,
            amount,
            currency: currency || 'NGN',
            status: 'pending',
            reference: tx_ref
        });

        // Generate Flutterwave payment link
        const paymentData = await generatePaymentLink({
            amount,
            currency: currency || 'NGN',
            email: user.email,
            name: user.name || 'Audius User',
            tx_ref: tx_ref,
            redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment/verify?type=funding`,
            meta: req.body.meta || {
                userId: user.id,
                type: 'funding'
            }
        });


        res.json({
            status: 'success',
            data: {
                link: paymentData.link,
                publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
                tx_ref: tx_ref,
                amount,
                currency: currency || 'NGN',
                customer: {
                    email: user.email,
                    name: user.name || 'Audius User'
                },
                customizations: {
                    title: "Audius Clone - Wallet Funding",
                    description: `Funding wallet with ${currency || 'NGN'} ${amount}`,
                    logo: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/public/images/logo.png`
                }
            }
        });
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        logger.error('Payment initialization failed:', errorData);
        res.status(500).json({
            message: 'Payment initialization failed'
        });
    }
}

// Webhook / Verification
async function verifyTransaction(req, res) {
    try {
        // Accept transaction_id from either query params or body
        const { transaction_id } = req.query.transaction_id ? req.query : req.body;

        if (!transaction_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Transaction ID is required'
            });
        }

        console.log('Verifying transaction:', transaction_id);
        const data = await verifyPayment(transaction_id);

        if (data && data.status === 'successful') {
            const txRef = data.tx_ref;
            console.log('✅ Payment successful on Flutterwave, tx_ref:', txRef);
            console.log('📦 Verification data details:', JSON.stringify({
                amount: data.amount,
                currency: data.currency,
                customer: data.customer?.email,
                meta: data.meta
            }));

            const result = await withDbTransaction(sequelize, async (transaction) => {
                console.log('🔄 Searching for transaction record with reference:', txRef);
                // CRITICAL: Lock the row for update to prevent race conditions
                const txn = await Transaction.findOne({
                    where: { reference: txRef },
                    lock: Sequelize.Transaction.LOCK.UPDATE,
                    transaction
                });

                if (!txn) {
                    throw { status: 404, message: 'Transaction not found in database' };
                }

                // Idempotency check: If already processed, return success without re-crediting
                if (txn.status === 'successful') {
                    return {
                        alreadyProcessed: true,
                        transaction: {
                            flutterwaveReference: txRef,
                            currency: txn.currency,
                            fiatAmount: txn.amount,
                            type: 'wallet_funding'
                        }
                    };
                }

                // Update transaction status within the transaction
                await txn.update({ status: 'successful' }, { transaction });

                // Credit the Platform Wallet (a-tokens + specific fiat balance)
                let wallet = await lockRow(CoinWallet,
                    { userId: txn.userId, artistId: null },
                    transaction
                );

                if (!wallet) {
                    wallet = await CoinWallet.create({
                        userId: txn.userId,
                        artistId: null,
                        balance: 0,
                        balanceUSD: 0,
                        balanceNGN: 0,
                        lifetimeEarned: 0,
                        lifetimeSpent: 0
                    }, { transaction });
                }

                // Allocate to specific fiat balance
                if (txn.currency === 'USD') {
                    await wallet.increment({ balanceUSD: txn.amount }, { transaction });
                } else if (txn.currency === 'NGN') {
                    await wallet.increment({ balanceNGN: txn.amount }, { transaction });
                }

                // Credit a-tokens (Check for subscription tier first)
                let tokenAmount;
                const meta = data.meta || data.meta_data || {};

                if (meta.type === 'subscription' && meta.tier) {
                    const { SUBSCRIPTION_TIERS } = require('../constants/subscriptionTiers');
                    const tierConfig = SUBSCRIPTION_TIERS[meta.tier];
                    if (tierConfig && tierConfig.aTokens) {
                        tokenAmount = tierConfig.aTokens;
                        console.log(`🎟️ Subscription detected: Using fixed ${tokenAmount} A-Tokens for tier "${meta.tier}"`);
                    }
                }

                if (tokenAmount === undefined) {
                    // Fallback to standard conversion (1 USD = 1 a-token, 1500 NGN = 1 a-token)
                    const conversionRate = 1500;
                    tokenAmount = txn.currency === 'USD' ? txn.amount : (txn.amount / conversionRate);
                }

                await wallet.increment({ balance: tokenAmount }, { transaction });


                // Log the coin transaction
                await CoinTransaction.create({
                    userId: txn.userId,
                    type: 'purchase',
                    coinAmount: tokenAmount,
                    fiatAmount: txn.amount,
                    currency: txn.currency,
                    status: 'completed',
                    description: `Wallet funded via ${txn.currency} ${txn.amount}`,
                    flutterwaveReference: txRef
                }, { transaction });

                console.log(`✅ Wallet credited: ${tokenAmount} A-Tokens + ${txn.currency} ${txn.amount}`);

                return {
                    flutterwaveReference: txRef,
                    currency: txn.currency,
                    fiatAmount: txn.amount,
                    coinAmount: tokenAmount,
                    type: 'wallet_funding'
                };
            });

            return res.json({
                status: 'success',
                message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified and wallet credited',
                transaction: result.transaction || result
            });
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Payment verification failed - transaction not successful on Flutterwave'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        const status = error.status || 500;
        return res.status(status).json({
            status: 'error',
            message: error.message || 'Error verifying payment'
        });
    }
}

// Withdrawal Endpoint
async function withdrawFunds(req, res) {
    try {
        const { amount, currency, bankCode, accountNumber } = req.body;
        const userId = req.user.id;

        // Wrap entire operation in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Lock wallet row BEFORE checking balance
            const wallet = await lockRow(
                CoinWallet,
                { userId, artistId: null },
                transaction
            );

            if (!wallet) {
                throw { status: 404, message: 'Wallet not found' };
            }

            const balanceField = currency === 'USD' ? 'balanceUSD' : 'balanceNGN';

            // Check balance (now safe from race conditions)
            if (wallet[balanceField] < amount) {
                throw {
                    status: 400,
                    message: 'Insufficient funds',
                    required: amount,
                    available: wallet[balanceField],
                    currency
                };
            }

            // Initialize Flutterwave Transfer BEFORE deducting
            const transferResponse = await axios.post(
                `${process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'}/transfers`,
                {
                    account_bank: bankCode,
                    account_number: accountNumber,
                    amount,
                    currency,
                    narration: "Audius Wallet Withdrawal",
                    reference: `withdraw_${Date.now()}_${userId}`
                },
                {
                    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
                }
            );

            // Only deduct if transfer succeeded
            if (transferResponse.data.status !== 'success') {
                throw {
                    status: 400,
                    message: 'Transfer failed',
                    details: transferResponse.data.message
                };
            }

            // Deduct from wallet
            await wallet.decrement({ [balanceField]: amount }, { transaction });

            // Log transaction
            await CoinTransaction.create({
                userId,
                type: 'spend',
                coinAmount: 0,
                fiatAmount: amount,
                currency,
                status: 'completed',
                description: `Bank Withdrawal to ${accountNumber}`,
                flutterwaveReference: transferResponse.data.data.reference
            }, { transaction });

            return {
                reference: transferResponse.data.data.reference,
                amount,
                currency,
                newBalance: parseFloat(wallet[balanceField]) - parseFloat(amount)
            };
        });

        res.json({
            message: 'Withdrawal successful',
            reference: result.reference,
            amount: result.amount,
            currency: result.currency,
            newBalance: result.newBalance
        });
    } catch (error) {
        console.error('withdrawFunds ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                details: error.details,
                required: error.required,
                available: error.available,
                currency: error.currency
            });
        }

        res.status(500).json({ message: 'Failed to process withdrawal' });
    }
}

module.exports = {
    initializePayment,
    verifyTransaction,
    withdrawFunds
};
