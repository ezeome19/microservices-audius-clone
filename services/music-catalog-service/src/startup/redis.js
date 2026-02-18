const {
    createRedisClient,
    CacheManager,
    audiusService,
    logger
} = require('../../../../shared');

module.exports = function (app) {
    console.log('[Music Catalog Service] Initializing Redis Caching...');
    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    };

    try {
        const redisClient = createRedisClient(redisConfig, 'Music Catalog Service');
        const cacheManager = new CacheManager(redisClient);

        // Inject cache manager into Audius Service
        audiusService.setCacheManager(cacheManager);

        // Make cache manager available to app
        if (typeof app !== 'undefined' && app !== null) {
            app.locals.cache = cacheManager;
        }

        logger.info('[Music Catalog Service] Redis Caching initialized.');
        console.log('[Music Catalog Service] Redis Caching initialized.');
        return cacheManager;
    } catch (error) {
        console.error('[Music Catalog Service] Failed to initialize Redis Caching:', error);
        return null;
    }
};
