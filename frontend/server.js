const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register Security Headers
fastify.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://*.flutterwave.com", "https://*.f4b-flutterwave.com", "https://checkout.flutterwave.com", "https://kit.fontawesome.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://*", "data:"],
            imgSrc: ["'self'", "data:", "https://*", "http://*"], // Allow images from anywhere (album art)
            connectSrc: ["'self'", "https://*", "http://*"], // Allow API calls
            frameSrc: ["'self'", "https://*.flutterwave.com", "https://*.f4b-flutterwave.com", "https://checkout.flutterwave.com"],
            mediaSrc: ["'self'", "https://*"],
            scriptSrcAttr: ["'unsafe-inline'"],
            upgradeInsecureRequests: null
        }
    }
});

// Register plugins
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
});

const handlebars = require('handlebars');

// Register Handlebars helpers
handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('json', (context) => JSON.stringify(context));
handlebars.registerHelper('toLowerCase', (str) => str ? str.toLowerCase() : '');
handlebars.registerHelper('substring', (str, start, end) => str ? str.substring(start, end) : '');
handlebars.registerHelper('or', (a, b) => a || b);
handlebars.registerHelper('add', (a, b) => a + b);

fastify.register(require('@fastify/view'), {
    engine: {
        handlebars: handlebars
    },
    root: path.join(__dirname, 'views'),
    layout: 'layouts/main.hbs',
    options: {
        partials: {
            'artist-card': 'partials/artist-card.hbs',
            'upgradeToMerchantModal': 'partials/upgradeToMerchantModal.hbs',
            'sidebar': 'partials/sidebar.hbs',
            'coinPurchaseModal': 'partials/coinPurchaseModal.hbs',
            'tipModal': 'partials/tipModal.hbs',
            'commentModal': 'partials/commentModal.hbs'
        }
    }
});

fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/cookie'));

// Proxy API requests to backend gateway
fastify.register(require('@fastify/http-proxy'), {
    upstream: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    prefix: '/api',
    rewritePrefix: '/api',
    http2: false, // Ensure http1
    replyOptions: {
        rewriteRequestHeaders: (request, headers) => {
            if (request.cookies.token && !headers['x-auth-token']) {
                headers['x-auth-token'] = request.cookies.token;
            }
            return headers;
        }
    }
});

// Proxy /health to API gateway for admin dashboard service health monitoring
fastify.register(require('@fastify/http-proxy'), {
    upstream: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    prefix: '/health',
    rewritePrefix: '/health',
    http2: false
});

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/artists'), { prefix: '/artists' });
fastify.register(require('./routes/dashboard'), { prefix: '/dashboard' });
fastify.register(require('./routes/artist'), { prefix: '/artist' });
fastify.register(require('./routes/settings'), { prefix: '/settings' });
fastify.register(require('./routes/analytics'), { prefix: '/analytics' });
fastify.register(require('./routes/payment'), { prefix: '/payment' });

// Home route
fastify.get('/', async (request, reply) => {
    return reply.redirect('/auth/signup');
});

// Favicon route (empty to stop 404s)
fastify.get('/favicon.ico', async (request, reply) => {
    return reply.status(204).send();
});

// Start server
const start = async () => {
    try {
        const PORT = process.env.FRONTEND_PORT || 8080;
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
