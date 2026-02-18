const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

module.exports = function (app) {
    app.use(helmet());
    app.use(compression());

    // Audit #14: Request Size Limits (Transparent)
    // We check Content-Length WITHOUT parsing the body to avoid breaking the proxy stream
    app.use((req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            const contentLength = req.headers['content-length'];
            const limit = 10 * 1024 * 1024; // 10MB limit for general requests (adjust as needed)

            // For auth routes, keep it strict (10KB)
            if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/social')) {
                const strictLimit = 10 * 1024; // 10KB
                if (contentLength && parseInt(contentLength) > strictLimit) {
                    return res.status(413).json({ message: 'Payload too large' });
                }
            } else if (contentLength && parseInt(contentLength) > limit) {
                return res.status(413).json({ message: 'Payload too large' });
            }
        }
        next();
    });

    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:8080',
        'http://localhost:3000'
    ].filter(Boolean);

    // CORS configuration to allow credentials (cookies)
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // CRITICAL: Allow cookies to be sent cross-origin
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
    }));
};
