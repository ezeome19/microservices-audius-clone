// Utilities
const logger = require('./utils/logger');
const { createDbConnection, initializeDatabase } = require('./utils/dbConnection');
const createMongoConnection = require('./utils/mongoConnection');
const { mongoose } = createMongoConnection;
const { createRedisClient, CacheManager } = require('./utils/redisConnection');
const validateConfig = require('./utils/validateConfig');

// Middleware
const errorMiddleware = require('./middleware/error');
const validateMiddleware = require('./middleware/validate');
const authMiddleware = require('./middleware/auth');
const optionalAuthMiddleware = require('./middleware/optionalAuth');
const adminMiddleware = require('./middleware/admin');
const merchantMiddleware = require('./middleware/merchant');
const {
    authLimiter,
    paymentLimiter,
    tipLimiter,
    apiLimiter,
    withdrawLimiter
} = require('./middleware/rateLimiter');
const {
    withTransaction,
    withDbTransaction,
    lockRow,
    lockRowById,
    isAlreadyProcessed
} = require('./middleware/transaction');
const audiusService = require('./utils/audiusService');

module.exports = {
    // Utilities
    logger,
    createDbConnection,
    initializeDatabase,
    createMongoConnection,
    mongoose,
    createRedisClient,
    CacheManager,

    // Middleware
    errorMiddleware,
    validateMiddleware,
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware,
    merchantMiddleware,

    // Rate Limiters
    authLimiter,
    paymentLimiter,
    tipLimiter,
    apiLimiter,
    withdrawLimiter,

    // Transaction Utilities
    withTransaction,
    withDbTransaction,
    lockRow,
    lockRowById,
    isAlreadyProcessed,

    // Services
    audiusService,

    // Config
    validateConfig
};
