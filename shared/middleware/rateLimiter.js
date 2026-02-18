const rateLimit = require('express-rate-limit');

/**
 * Shared rate limiter configurations for different endpoint types
 * Usage: Import and apply to routes that need rate limiting
 */

// Authentication endpoints (strict - prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        status: 'error',
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count all requests
});

// Payment endpoints (moderate - prevent spam)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment requests per 15 minutes
    message: {
        status: 'error',
        message: 'Too many payment requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Tip endpoints (strict - prevent spam tipping)
const tipLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 tips per 5 minutes
    message: {
        status: 'error',
        message: 'Too many tip requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API endpoints (lenient)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        status: 'error',
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Withdrawal endpoints (very strict - prevent abuse)
const withdrawLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 withdrawals per hour
    message: {
        status: 'error',
        message: 'Too many withdrawal requests. Please try again in 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    paymentLimiter,
    tipLimiter,
    apiLimiter,
    withdrawLimiter
};
