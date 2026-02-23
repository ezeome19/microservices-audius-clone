const express = require('express');
const { authMiddleware, adminMiddleware, errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'analytics' }));

    // Analytics routes (Admin only)
    const analyticsRoutes = require('../routes/analytics');
    app.use('/', authMiddleware, adminMiddleware, analyticsRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
