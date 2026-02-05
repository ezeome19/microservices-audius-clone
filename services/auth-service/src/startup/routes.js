const express = require('express');
const users = require('../routes/users');
const merchants = require('../routes/merchants');
const { errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // API routes - Gateway strips /api/auth via app.use(), so we mount at /
    app.use('/', users);
    app.use('/merchants', merchants);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
