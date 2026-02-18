const { logger, createMongoConnection } = require('../../../../shared');


module.exports = function (app) {
    // Connect to MongoDB
    const mongoUri = process.env.STREAMING_MONGO_URI;

    let connectionPromise;
    if (!mongoUri) {
        logger.error('[Streaming Service] FATAL: STREAMING_MONGO_URI is undefined.');
        // Fallback for debugging
        const fallbackUri = 'mongodb://localhost:27017/streaming';
        logger.warn(`[Streaming Service] Using fallback URI: ${fallbackUri}`);
        connectionPromise = createMongoConnection(fallbackUri, 'Streaming Service');
    } else {
        logger.info(`[Streaming Service] Attempting to connect to MongoDB with URI: ${mongoUri}`);
        connectionPromise = createMongoConnection(mongoUri, 'Streaming Service');
    }

    connectionPromise
        .then(() => {
            const PORT = process.env.STREAMING_PORT || 3003;
            app.listen(PORT, () => {
                logger.info(`[Streaming Service] Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            logger.error('[Streaming Service] MongoDB connection failed:', err);
            // Start the server anyway to avoid ECONNREFUSED from gateway
            const PORT = process.env.STREAMING_PORT || 3003;
            app.listen(PORT, () => {
                logger.warn(`[Streaming Service] Server running on port ${PORT} (NO DATABASE)`);
            });
        });
};
