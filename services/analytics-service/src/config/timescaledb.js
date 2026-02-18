const { createDbConnection } = require('../../../../shared');
const { logger } = require('../../../../shared');

const dbConfig = {
    database: process.env.ANALYTICS_DB_NAME,
    username: process.env.ANALYTICS_DB_USER,
    password: process.env.ANALYTICS_DB_PASSWORD,
    host: process.env.ANALYTICS_DB_HOST,
    port: parseInt(process.env.ANALYTICS_DB_PORT) || 5432
};

// Create Sequelize instance (TimescaleDB uses PostgreSQL protocol)
const sequelize = createDbConnection(dbConfig, 'Analytics Service');

// Initialize TimescaleDB hypertable
// Hypertables are optimized for time-series data
async function initializeTimescaleDB() {
    try {
        await sequelize.authenticate();
        logger.info('[Analytics Service] Connected to TimescaleDB');

        // Create TimescaleDB extension if not exists
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');

        // Sync models
        await sequelize.sync({ alter: false });

        // Convert events table to hypertable (if not already)
        await sequelize.query(`
            SELECT create_hypertable('events', 'timestamp', 
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
        `).catch(err => {
            // Ignore error if hypertable already exists
            if (!err.message.includes('already a hypertable')) {
                throw err;
            }
        });

        logger.info('[Analytics Service] TimescaleDB hypertable initialized');
    } catch (error) {
        logger.error('[Analytics Service] TimescaleDB initialization failed:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    initializeTimescaleDB
};
