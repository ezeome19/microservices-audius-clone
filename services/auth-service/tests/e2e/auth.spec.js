const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api/auth';
const TEST_USER = {
    email: 'noobpg19@gmail.com',
    password: 'mynewpass'
};

describe('Auth Service E2E (via Gateway)', () => {

    it('should login successfully and return a token', async () => {
        try {
            const response = await axios.post(`${GATEWAY_URL}/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });

            expect(response.status).toBe(200);
            expect(response.data.token).toBeDefined();
            expect(response.data.user.email).toBe(TEST_USER.email);

            console.log('Login Token:', response.data.token);
        } catch (error) {
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error('Login Failed:', msg);
            fail('Login failed: ' + msg);
        }
    });

    it('should fail login with wrong password', async () => {
        try {
            await axios.post(`${GATEWAY_URL}/login`, {
                email: TEST_USER.email,
                password: 'wrongpassword'
            });
            fail('Should have thrown 401');
        } catch (error) {
            expect(error.response.status).toBe(400); // Or 401 depending on implementation
        }
    });
});
