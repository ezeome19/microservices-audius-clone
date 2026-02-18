const axios = require('axios');
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000';

async function analyticsRoute(fastify, options) {
    fastify.get('/', async (request, reply) => {
        const token = request.cookies.token;

        if (!token) {
            return reply.redirect('/auth/login');
        }

        try {
            // Fetch current user details
            const response = await axios.get(`${API_GATEWAY_URL}/api/auth/me`, {
                headers: { 'x-auth-token': token }
            });

            const user = response.data.user;

            // Check if user is a merchant
            if (user.userType !== 'merchant') {
                return reply.redirect('/dashboard');
            }

            return reply.view('analytics-dashboard.hbs', {
                title: 'Analytics - Audius Clone',
                user: user
            });
        } catch (error) {
            request.log.error(error);
            if (error.response && error.response.status === 401) {
                return reply.redirect('/auth/login');
            }
            return reply.view('error.hbs', { message: 'Failed to load analytics' });
        }
    });
}

module.exports = analyticsRoute;
