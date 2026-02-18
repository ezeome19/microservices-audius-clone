const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'admin_proven@example.com',
    password: 'mynewpass'
};

describe('Payment Service E2E (via Gateway)', () => {
    let token;

    beforeAll(async () => {
        try {
            const response = await axios.post(`${GATEWAY_URL}/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            token = response.data.token;
        } catch (error) {
            fail('Auth Failed: ' + (error.response ? error.response.data.message : error.message));
        }
    });

    it('should initialize a payment link', async () => {
        try {
            const response = await axios.post(`${GATEWAY_URL}/payment/initialize`, {
                amount: 5000,
                currency: 'NGN'
            }, {
                headers: { 'x-auth-token': token }
            });

            expect(response.status).toBe(200);
            expect(response.data.link).toBeDefined();
            expect(response.data.link).toContain('flutterwave.com');
            console.log('Payment Link Generated:', response.data.link);
        } catch (error) {
            fail('Payment Init Failed: ' + (error.response ? error.response.data.message : error.message));
        }
    });
});
