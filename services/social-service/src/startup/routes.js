const express = require('express');
const { errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Social routes
    const socialRoutes = require('../routes/social');
    app.use('/', socialRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
