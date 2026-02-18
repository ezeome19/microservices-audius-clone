const express = require('express');
const { authMiddleware, adminMiddleware, errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Analytics routes (Admin only)
    const analyticsRoutes = require('../routes/analytics');
    app.use('/', authMiddleware, adminMiddleware, analyticsRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
