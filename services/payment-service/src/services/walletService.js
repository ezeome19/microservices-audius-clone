const axios = require('axios');
const { Transaction } = require('../models/transaction');
const { logger } = require('../../../../shared');

const FLUTTERWAVE_URL = 'https://api.flutterwave.com/v3';
const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

// Verify Transaction with retry logic
async function verifyPayment(transactionId, retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔍 Verifying payment with Flutterwave (Attempt ${attempt}/${retries}):`, transactionId);

            const response = await axios.get(`${FLUTTERWAVE_URL}/transactions/${transactionId}/verify`, {
                headers: { Authorization: `Bearer ${SECRET_KEY}` }
            });

            console.log('✅ Flutterwave response status:', response.data.status);
            console.log('📦 Flutterwave response data:', JSON.stringify(response.data, null, 2));

            const { status, currency, amount, customer } = response.data.data;

            console.log(`💰 Transaction details - Status: ${status}, Amount: ${amount} ${currency}`);

            // Check if successful
            if (status === 'successful') {
                console.log('✅ Payment verified successfully');
                return response.data.data;
            } else if (status === 'pending' && attempt < retries) {
                // If pending and we have retries left, wait and try again
                console.log(`⏳ Payment pending, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5; // Exponential backoff
                continue;
            }

            console.log('❌ Payment not successful, status:', status);
            return null;
        } catch (error) {
            console.error(`❌ Flutterwave Verification Failed (Attempt ${attempt}/${retries}):`, error.message);

            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);

                // If 404 and we have retries left, the transaction might not be ready yet
                if (error.response.status === 404 && attempt < retries) {
                    console.log(`⏳ Transaction not found yet, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 1.5;
                    continue;
                }
            }

            logger.error('Flutterwave Verification Failed:', error.message);

            // If this is the last attempt, throw the error
            if (attempt === retries) {
                throw error;
            }
        }
    }

    return null;
}

// Generate Payment Link
async function generatePaymentLink(options) {
    try {
        const { amount, currency, email, name, tx_ref, redirect_url, meta } = options;

        const response = await axios.post(`${FLUTTERWAVE_URL}/payments`, {
            tx_ref: tx_ref,
            amount,
            currency: currency || 'NGN',
            redirect_url: redirect_url,
            customer: {
                email: email,
                name: name
            },
            meta: meta,
            customizations: {
                title: "Audius Payment",
                logo: "https://audius.co/logo.png"
            }
        }, {
            headers: { Authorization: `Bearer ${SECRET_KEY}` }
        });

        return { link: response.data.data.link };
    } catch (error) {
        logger.error('Flutterwave Link Generation Failed:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    verifyPayment,
    generatePaymentLink
};
