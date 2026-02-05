const express = require('express');
const {
    authMiddleware,
    adminMiddleware,
    errorMiddleware,
    paymentLimiter,
    tipLimiter,
    withdrawLimiter
} = require('../../../../shared');

module.exports = function (app) {
    app.use(express.json());

    // Payment routes
    const paymentRoutes = require('../routes/payments');
    const coinRoutes = require('../routes/coins');
    const subscriptionRoutes = require('../routes/subscriptions');
    const tipRoutes = require('../routes/tips');
    const webhookRoutes = require('../routes/webhooks');

    app.use('/', authMiddleware, paymentRoutes);
    app.use('/coins', authMiddleware, paymentLimiter, coinRoutes); // Rate limited
    app.use('/subscriptions', paymentLimiter, subscriptionRoutes); // Rate limited
    app.use('/tips', authMiddleware, tipLimiter, tipRoutes); // Rate limited
    app.use('/webhooks', webhookRoutes); // No auth - verified by signature

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
