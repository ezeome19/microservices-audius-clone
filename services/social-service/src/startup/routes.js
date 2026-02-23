const express = require('express');
const { errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'social' }));

    // Social routes
    const socialRoutes = require('../routes/social');
    app.use('/', socialRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
