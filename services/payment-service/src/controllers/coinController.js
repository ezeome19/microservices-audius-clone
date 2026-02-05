const { ArtistCoin, CoinWallet, CoinTransaction } = require('../models');
const { generatePaymentLink, verifyPayment } = require('../services/walletService');

// Coin packages with bonus coins
const COIN_PACKAGES = {
    'starter-50': { coins: 50, priceNGN: 900, priceUSD: 1.00, bonus: 0 },
    'popular-200': { coins: 200, priceNGN: 3500, priceUSD: 4.00, bonus: 10 },
    'value-500': { coins: 500, priceNGN: 8500, priceUSD: 10.00, bonus: 50 },
    'premium-1000': { coins: 1000, priceNGN: 16000, priceUSD: 19.00, bonus: 150 }
};

// Initialize coin purchase
async function initializeCoinPurchase(req, res) {
    try {
        const { artistId, packageId, currency = 'NGN' } = req.body;
        const userId = req.user.id;

        // Validate package
        const package = COIN_PACKAGES[packageId];
        if (!package) {
            return res.status(400).json({ message: 'Invalid package selected' });
        }

        // Verify artist coin exists
        const artistCoin = await ArtistCoin.findOne({ where: { artistId, isActive: true } });
        if (!artistCoin) {
            return res.status(404).json({ message: 'Artist coin not found or inactive' });
        }

        const amount = currency === 'NGN' ? package.priceNGN : package.priceUSD;
        const totalCoins = package.coins + package.bonus;

        // Create pending transaction
        const transaction = await CoinTransaction.create({
            userId,
            artistId,
            type: 'purchase',
            coinAmount: totalCoins,
            fiatAmount: amount,
            currency,
            status: 'pending',
            metadata: { packageId, bonus: package.bonus },
            description: `Purchase ${totalCoins} ${artistCoin.coinSymbol} coins`
        });

        // Generate Flutterwave payment link
        const paymentData = await generatePaymentLink({
            amount,
            currency,
            email: req.user.email,
            tx_ref: transaction.id,
            redirect_url: `${process.env.FRONTEND_URL}/payment/verify`,
            meta: {
                userId,
                artistId,
                transactionId: transaction.id,
                coinAmount: totalCoins
            }
        });

        // Update transaction with Flutterwave reference
        await transaction.update({ flutterwaveReference: paymentData.tx_ref });

        res.json({
            message: 'Payment initialized',
            paymentLink: paymentData.link,
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: transaction.id,
            amount: transaction.fiatAmount,
            currency: transaction.currency,
            customer: {
                email: req.user.email,
                name: req.user.name
            },
            reference: transaction.id,
            coins: totalCoins,
            amount
        });
    } catch (error) {
        console.error('initializeCoinPurchase ERROR:', error);
        res.status(500).json({ message: 'Failed to initialize coin purchase' });
    }
}

// Verify coin purchase after Flutterwave payment
async function verifyCoinPurchase(req, res) {
    const { withDbTransaction, lockRowById, isAlreadyProcessed } = require('../../../../shared');
    const { sequelize, CoinWallet, CoinTransaction, ArtistCoin } = require('../models');

    try {
        const { reference } = req.body;

        // Wrap entire operation in transaction
        const result = await withDbTransaction(sequelize, async (transaction) => {
            // Lock the transaction row to prevent race conditions
            const txn = await lockRowById(CoinTransaction, reference, transaction);

            if (!txn) {
                throw { status: 404, message: 'Transaction not found' };
            }

            // Idempotency check - if already completed, return early
            if (isAlreadyProcessed(txn, 'status', 'completed')) {
                return {
                    alreadyProcessed: true,
                    message: 'Transaction already completed',
                    coins: txn.coinAmount
                };
            }

            // Verify with Flutterwave
            const paymentVerification = await verifyPayment(txn.flutterwaveReference);

            if (paymentVerification.status !== 'successful') {
                await txn.update({ status: 'failed' }, { transaction });
                throw {
                    status: 400,
                    message: 'Payment verification failed',
                    verificationStatus: paymentVerification.status
                };
            }

            // Credit coins to user wallet (all within transaction)
            let wallet = await lockRow(CoinWallet,
                { userId: txn.userId, artistId: txn.artistId },
                transaction
            );

            if (!wallet) {
                wallet = await CoinWallet.create({
                    userId: txn.userId,
                    artistId: txn.artistId,
                    balance: 0,
                    lifetimeEarned: 0,
                    lifetimeSpent: 0
                }, { transaction });
            }

            await wallet.increment({
                balance: txn.coinAmount,
                lifetimeEarned: txn.coinAmount
            }, { transaction });

            await wallet.update({ lastTransaction: new Date() }, { transaction });

            // Update circulating supply
            const artistCoin = await lockRow(ArtistCoin, { artistId: txn.artistId }, transaction);
            if (artistCoin) {
                await artistCoin.increment('circulatingSupply', {
                    by: txn.coinAmount,
                    transaction
                });
            }

            // Mark transaction as completed
            await txn.update({ status: 'completed' }, { transaction });

            return {
                alreadyProcessed: false,
                coins: txn.coinAmount,
                newBalance: parseFloat(wallet.balance) + parseFloat(txn.coinAmount)
            };
        });

        // Handle result
        if (result.alreadyProcessed) {
            return res.json({
                message: result.message,
                coins: result.coins
            });
        }

        res.json({
            message: 'Coins credited successfully',
            coins: result.coins,
            newBalance: result.newBalance
        });
    } catch (error) {
        console.error('verifyCoinPurchase ERROR:', error);

        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                status: error.verificationStatus
            });
        }

        res.status(500).json({ message: 'Failed to verify coin purchase' });
    }
}

// Get user's coin wallets
async function getUserWallets(req, res) {
    try {
        const userId = req.user.id;

        const wallets = await CoinWallet.findAll({
            where: { userId },
            include: [{
                model: ArtistCoin,
                as: 'artistCoin',
                attributes: ['coinName', 'coinSymbol', 'pricePerCoin']
            }],
            order: [['balance', 'DESC']]
        });

        res.json({
            message: 'Wallets retrieved successfully',
            wallets
        });
    } catch (error) {
        console.error('getUserWallets ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve wallets' });
    }
}

// Get coin packages
async function getCoinPackages(req, res) {
    try {
        const { artistId } = req.params;

        const artistCoin = await ArtistCoin.findOne({ where: { artistId } });
        if (!artistCoin) {
            return res.status(404).json({ message: 'Artist coin not found' });
        }

        const packages = Object.entries(COIN_PACKAGES).map(([id, pkg]) => ({
            id,
            ...pkg,
            totalCoins: pkg.coins + pkg.bonus,
            artistCoin: {
                name: artistCoin.coinName,
                symbol: artistCoin.coinSymbol
            }
        }));

        res.json({
            message: 'Packages retrieved successfully',
            packages,
            artistCoin
        });
    } catch (error) {
        console.error('getCoinPackages ERROR:', error);
        res.status(500).json({ message: 'Failed to retrieve packages' });
    }
}

module.exports = {
    initializeCoinPurchase,
    verifyCoinPurchase,
    getUserWallets,
    getCoinPackages
};
