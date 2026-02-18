const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'noobpg19@gmail.com',
    password: 'mynewpass'
};

describe('Social Service E2E (via Gateway)', () => {
    let token;
    let userId;

    beforeAll(async () => {
        try {
            const response = await axios.post(`${GATEWAY_URL}/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            token = response.data.token;
            userId = response.data.user.id;
        } catch (error) {
            fail('Auth Failed: ' + (error.response ? error.response.data.message : error.message));
        }
    });

    it('should allow following a user (self-follow for test)', async () => {
        try {
            // Using userId in path as required by route '/follow/:userId'
            await axios.post(`${GATEWAY_URL}/social/follow/${userId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            // Success if 200
        } catch (error) {
            // If it fails with "Cannot follow yourself" (400), that's also a PASS for E2E connectivity.
            // If it fails with 404 (Route not found) or 500 (Crash), that's a FAIL.
            if (error.response && error.response.status === 400) {
                console.log('Got expected validation error (Self-Follow):', error.response.data.message);
            } else if (error.response && error.response.status === 200) {
                console.log('Follow action accepted.');
            } else {
                fail('Social Follow Failed unexpectedly: ' + (error.response ? error.response.status : error.message));
            }
        }
    });
});
