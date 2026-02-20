async function register(fastify, options) {
    fastify.get('/', async (request, reply) => {
        const token = request.cookies.token;

        if (!token) {
            return reply.redirect('/auth/login');
        }

        try {
            const axios = require('axios');
            const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

            const response = await axios.get(`${API_GATEWAY_URL}/api/auth/me`, {
                headers: { 'x-auth-token': token }
            });

            const user = response.data.user;
            const syncSession = request.query.sync_session === 'true';

            return reply.view('dashboard', {
                title: 'Dashboard - Audius Clone',
                user: user,
                token: token,
                syncSession: syncSession
            });
        } catch (error) {
            console.error('Error fetching user profile for dashboard:', error.message);
            // If it's a 401/403, redirect to login
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                return reply.redirect('/auth/login');
            }
            // Otherwise show a proper error or fallback with warning
            return reply.view('dashboard', {
                title: 'Dashboard - Audius Clone',
                user: { name: 'User (Session Error)', userType: 'consumer', isError: true }
            });
        }
    });
}

module.exports = register;
