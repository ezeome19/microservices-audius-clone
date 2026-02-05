const { logger } = require('../../../../shared');
const { createMongoConnection, createRedisClient } = require('../../../../shared');


module.exports = function (app) {
    // Connect to MongoDB
    createMongoConnection(process.env.RECOMMENDATIONS_MONGO_URI, 'Recommendations Service')
        .catch(err => {
            logger.error('[Recommendations Service] MongoDB connection failed:', err);
        });

    // Connect to Redis
    const redisConfig = {
        host: process.env.RECOMMENDATIONS_REDIS_HOST || 'localhost',
        port: parseInt(process.env.RECOMMENDATIONS_REDIS_PORT) || 6379
    };
    global.redisClient = createRedisClient(redisConfig, 'Recommendations Service');

    // Start server
    const PORT = process.env.RECOMMENDATIONS_PORT || 3006;
    app.listen(PORT, () => {
        logger.info(`[Recommendations Service - ADMIN ONLY] Server running on port ${PORT}`);
    });
};
