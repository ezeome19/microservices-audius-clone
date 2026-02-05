const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'noobpg19@gmail.com',
    password: 'mynewpass'
};

describe('Streaming Service E2E (via Gateway)', () => {
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

    it('should handle request for non-existent song gracefully (404)', async () => {
        const fakeId = '65b2f7c00000000000000000'; // Random Mongo ID
        try {
            await axios.get(`${GATEWAY_URL}/stream/music/${fakeId}`, {
                headers: { 'x-auth-token': token }
            });
            fail('Should have returned 404 for fake song');
        } catch (error) {
            // We expect 404 because song doesn't exist, which PROVES the service is reachable and processing the ID.
            // If it was 500 or network error, that would be a fail.
            if (error.response) {
                expect(error.response.status).toBe(404);
                console.log('Streaming correctly returned 404 for missing song.');
            } else {
                fail('Network Error: ' + error.message);
            }
        }
    });
});
