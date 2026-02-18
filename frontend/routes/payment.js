const axios = require('axios');

module.exports = async function (fastify, opts) {
    // Payment verification page
    fastify.get('/verify', async (request, reply) => {
        const { transaction_id, status, type } = request.query;

        console.log('🔔 Frontend: Payment verification requested');
        console.log('📋 Transaction ID:', transaction_id);
        console.log('📋 Status from Flutterwave:', status);
        console.log('📋 Payment Type:', type);

        if (!transaction_id) {
            console.log('❌ Frontend: No transaction ID provided');
            return reply.view('payment/error', {
                title: 'Payment Error',
                message: 'Invalid transaction reference'
            });
        }

        try {
            // Determine backend URL based on type
            let backendPath = '/api/payment/verify'; // Default (funding)
            let payload = { transaction_id };

            if (type === 'tip') {
                backendPath = '/api/payment/tips/verify';
            } else if (type === 'subscription') {
                backendPath = '/api/payment/subscriptions/verify';
            }


            const apiUrl = `${process.env.API_GATEWAY_URL || 'http://localhost:3000'}${backendPath}`;
            console.log('🌐 Frontend: Calling backend API:', apiUrl);

            // Call backend to verify the payment
            const response = await axios.post(
                apiUrl,
                payload,
                {
                    headers: {
                        'x-auth-token': request.cookies.token
                    }
                }
            );

            console.log('✅ Frontend: Backend response received');
            console.log('📦 Response status:', response.data.status);
            console.log('📦 Response message:', response.data.message);

            const result = response.data;

            if (result.status === 'success' || result.status === 'completed') {
                // Payment successful
                console.log('✅ Frontend: Showing success page');
                return reply.view('payment/success', {
                    title: 'Payment Successful',
                    transaction: result.transaction,
                    message: result.message,
                    artistId: result.artistId
                });
            } else {
                console.log('❌ Frontend: Verification failed', result);
                return reply.view('payment/error', {
                    title: 'Verification Failed',
                    message: result.message || 'Payment verification failed'
                });
            }
        } catch (error) {
            console.error('❌ Frontend: Payment verification error:', error.message);
            if (error.response) {
                console.error('Backend response status:', error.response.status);
                console.error('Backend response data:', error.response.data);
            }
            return reply.view('payment/error', {
                title: 'Payment Error',
                message: error.response?.data?.message || 'An error occurred while verifying your payment. Please contact support.'
            });
        }
    });
};
