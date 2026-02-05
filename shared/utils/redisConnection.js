const Redis = require('ioredis');
const logger = require('./logger');

// Create Redis client
function createRedisClient(config, serviceName) {
    const redis = new Redis({
        host: config.host,
        port: config.port,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    redis.on('connect', () => {
        logger.info(`[${serviceName}] Connected to Redis`);
    });

    redis.on('error', (err) => {
        logger.error(`[${serviceName}] Redis error:`, err);
    });

    return redis;
}

// Cache wrapper with automatic JSON serialization
class CacheManager {
    constructor(redisClient, defaultTTL = 3600) {
        this.redis = redisClient;
        this.defaultTTL = defaultTTL;
    }

    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }

    async set(key, value, ttl = this.defaultTTL) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
    }

    async del(key) {
        await this.redis.del(key);
    }

    async exists(key) {
        return await this.redis.exists(key);
    }
}

module.exports = {
    createRedisClient,
    CacheManager
};
