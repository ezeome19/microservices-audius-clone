const { Sequelize } = require('sequelize');
const logger = require('./logger');

function createDbConnection(config, serviceName) {
    const sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            port: config.port,
            dialect: 'postgres',
            logging: false, // Disable SQL logging in production
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );

    return sequelize;
}

// Initialize database connection and sync models

async function initializeDatabase(sequelize, serviceName) {
    try {
        // Test connection
        await sequelize.authenticate();
        logger.info(`[${serviceName}] Connected to PostgreSQL database`);

        // Sync models in development
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: false });
            logger.info(`[${serviceName}] Database models synchronized`);
        }
    } catch (error) {
        logger.error(`[${serviceName}] Unable to connect to database:`, error);
        throw error;
    }
}

module.exports = {
    createDbConnection,
    initializeDatabase
};
