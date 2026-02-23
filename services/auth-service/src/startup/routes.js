const express = require('express');
const users = require('../routes/users');
const merchants = require('../routes/merchants');
const { errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

    // API routes - Gateway strips /api/auth via app.use(), so we mount at /
    app.use('/merchants', merchants);
    app.use('/', users);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
