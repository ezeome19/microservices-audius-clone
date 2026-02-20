const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000';

async function register(fastify, options) {
    // Signup page
    fastify.get('/signup', async (request, reply) => {
        return reply.view('auth/signup', {
            title: 'Sign Up - Audius Clone',
            error: request.query.error
        });
    });

    // Signup form submission
    fastify.post('/signup', async (request, reply) => {
        try {
            const { email, password, name, age, gender, nationality } = request.body;

            // Call auth-service via API gateway
            const response = await axios.post(`${API_GATEWAY_URL}/api/auth/signup`, {
                email,
                password,
                name,
                age: age || undefined,
                gender: gender || undefined,
                nationality: nationality || undefined
            });

            // Store token in cookie
            reply.setCookie('token', response.data.token, {
                httpOnly: true,
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax',
                path: '/'
            });

            // Redirect to artist preferences
            return reply.redirect('/dashboard?sync_session=true');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Signup failed';
            return reply.redirect(`/auth/signup?error=${encodeURIComponent(errorMessage)}`);
        }
    });

    // Login page
    fastify.get('/login', async (request, reply) => {
        return reply.view('auth/login', {
            title: 'Login - Audius Clone',
            error: request.query.error
        });
    });

    // Login form submission
    fastify.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body;

            // Call auth-service via API gateway
            const response = await axios.post(`${API_GATEWAY_URL}/api/auth/login`, {
                email,
                password
            });

            // Store token in cookie
            reply.setCookie('token', response.data.token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/'
            });

            // Redirect to dashboard
            return reply.redirect('/dashboard?sync_session=true');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            return reply.redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
        }
    });

    // Logout
    fastify.get('/logout', async (request, reply) => {
        reply.clearCookie('token');
        return reply.redirect('/auth/login');
    });

    // Session sync (to isolation across tabs)
    fastify.post('/sync', async (request, reply) => {
        const { token } = request.body;
        if (!token) return reply.status(400).send({ message: 'Token required' });

        reply.setCookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });

        return reply.send({ status: 'success' });
    });
}

module.exports = register;
