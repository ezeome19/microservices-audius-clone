const {
    createRedisClient,
    CacheManager,
    audiusService,
    logger
} = require('../../../../shared');

module.exports = function (app) {
    console.log('[Social Service] Initializing Redis Caching...');
    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    };

    try {
        const redisClient = createRedisClient(redisConfig, 'Social Service');
        const cacheManager = new CacheManager(redisClient);

        // Inject cache manager into Audius Service
        audiusService.setCacheManager(cacheManager);

        // Make cache manager available to controllers via app.locals
        app.locals.cache = cacheManager;

        logger.info('[Social Service] Redis Caching initialized.');
        console.log('[Social Service] Redis Caching initialized.');
        return cacheManager;
    } catch (error) {
        console.error('[Social Service] Failed to initialize Redis Caching:', error);
        return null;
    }
};
