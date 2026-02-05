async function register(fastify, options) {
    fastify.get('/', async (request, reply) => {
        const token = request.cookies.token;

        if (!token) {
            return reply.redirect('/auth/login');
        }

        return reply.view('dashboard', {
            title: 'Dashboard - Audius Clone',
            user: { name: 'User' } // In a real app, we'd decode the token or fetch user profile
        });
    });
}

module.exports = register;
