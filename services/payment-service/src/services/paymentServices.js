const Transaction = require('../models/transaction');
const { logger } = require('../../../../shared');

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

// Initiate a payment
async function initiatePayment(user, amount) {
    const txRef = `AUDIUS_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Default redirect to frontend or specific callback
    // If using API Gateway, ensure these URLs are reachable
    const redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'http://127.0.0.1:3000/api/payment/callback';

    const payload = {
        tx_ref: txRef,
        amount: amount,
        currency: 'NGN',
        redirect_url: redirectUrl,
        customer: {
            email: user.email,
            name: user.name || user.username,
        },
        customizations: {
            title: 'Audius Premium',
            description: 'Subscribe to Audius Premium for offline listening and high-quality audio.',
            logo: 'https://audius.co/assets/img/header_logo_white.png'
        }
    };

    try {
        logger.info(`[Payment Service] Initiating payment for user ${user.id || user._id}`);

        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Payment initiation failed');
        }

        // Create pending transaction record
        await Transaction.create({
            userId: user.id || user._id, // Handle different user object structures
            reference: txRef,
            amount: amount,
            status: 'pending'
        });

        return data.data; // Returns link to redirect user to
    } catch (error) {
        logger.error('[Payment Service] Payment initiation error:', error);
        throw error;
    }
}

// Verify a payment (usually called on callback)
async function verifyPayment(transactionId) {
    try {
        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === 'success' && result.data.status === 'successful') {
            // Update transaction in DB
            const tx = await Transaction.findOne({ reference: result.data.tx_ref });
            if (tx) {
                tx.status = 'successful';
                tx.externalId = result.data.id;
                tx.updatedAt = new Date();
                await tx.save();

                // TODO: Grant premium access to user (Communication with User Service needed via event or direct DB update if shared DB, likely API call)
            }
            return { success: true, data: result.data };
        } else {
            return { success: false, message: 'Payment verification failed' };
        }

    } catch (error) {
        logger.error('[Payment Service] Verification error:', error);
        throw error;
    }
}

module.exports = {
    initiatePayment,
    verifyPayment
};
