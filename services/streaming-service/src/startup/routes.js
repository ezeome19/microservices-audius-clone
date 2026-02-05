const express = require('express');
const { errorMiddleware } = require('../../../../shared');


module.exports = function (app) {
    app.use(express.json());

    // Streaming routes
    const streamRoutes = require('../routes/stream');
    const historyRoutes = require('../routes/history');
    app.use('/music', streamRoutes);
    app.use('/history', historyRoutes);

    // Error handling middleware (must be last)
    app.use(errorMiddleware);
};
