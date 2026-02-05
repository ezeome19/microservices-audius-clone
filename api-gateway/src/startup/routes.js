const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');
const proxyOptions = require('../config/proxy');
const requestLogger = require('../middleware/requestLogger');
const notFound = require('../middleware/notFound');
const { errorMiddleware } = require('../../../shared');
module.exports = function (app) {
    // app.use(express.json()); // REMOVED: Body parsing interferes with proxying!
    app.use(requestLogger); // Request logging
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', services: services });
    });

    // Proxy routes to microservices
    app.use('/api/auth', createProxyMiddleware({
        target: services.auth,
        ...proxyOptions
    }));

    app.use('/api/music', createProxyMiddleware({
        target: services.music,
        ...proxyOptions
    }));

    app.use('/api/stream', createProxyMiddleware({
        target: services.streaming,
        ...proxyOptions
    }));

    app.use('/api/social', createProxyMiddleware({
        target: services.social,
        ...proxyOptions
    }));

    app.use('/api/payment', createProxyMiddleware({
        target: services.payment,
        ...proxyOptions
    }));

    app.use('/api/recommendations', createProxyMiddleware({
        target: services.recommendations,
        ...proxyOptions
    }));

    app.use('/api/analytics', createProxyMiddleware({
        target: services.analytics,
        ...proxyOptions
    }));

    app.use(notFound); // 404 handler
    app.use(errorMiddleware);
};
