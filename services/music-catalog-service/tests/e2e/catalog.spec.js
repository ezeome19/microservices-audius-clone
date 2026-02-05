const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'noobpg19@gmail.com',
    password: 'mynewpass'
};

describe('Music Catalog E2E (via Gateway)', () => {
    let token;

    beforeAll(async () => {
        // Authenticate first
        try {
            const response = await axios.post(`${GATEWAY_URL}/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            token = response.data.token;
            console.log('Music Test Authenticated. Token:', token.substring(0, 20) + '...');
        } catch (error) {
            fail('Auth Failed: ' + (error.response ? error.response.data.message : error.message));
        }
    });

    it('should retrieve list of songs', async () => {
        try {
            const response = await axios.get(`${GATEWAY_URL}/music/songs`, {
                headers: { 'x-auth-token': token }
            });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data.songs)).toBe(true);
            console.log('Songs found:', response.data.songs.length);
        } catch (error) {
            console.error('Get Songs Failed:', error.response ? error.response.data : error.message);
            fail('Get Songs Failed');
        }
    });

    it('should retrieve list of albums', async () => {
        try {
            const response = await axios.get(`${GATEWAY_URL}/music/albums`, {
                headers: { 'x-auth-token': token }
            });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data.albums)).toBe(true);
        } catch (error) {
            console.error('Get Albums Failed:', error.response ? error.response.data : error.message);
            fail('Get Albums Failed');
        }
    });
});
