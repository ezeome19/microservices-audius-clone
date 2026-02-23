const express = require('express');
const { errorMiddleware } = require('../../../../shared');

module.exports = function (app) {
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'recommendations' }));

    // Recommendations routes
    const recommendationRoutes = require('../routes/recommendations');
    // Mount at / because API Gateway strips /api/recommendations
    app.use('/', recommendationRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
