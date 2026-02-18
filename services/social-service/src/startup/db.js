const { initializeDatabase, logger } = require('../../../../shared');
const { Sequelize } = require('sequelize');

let sequelize;

function getSequelize() {
    if (!sequelize) {
        console.log('Initializing Social Service DB directly...');

        try {
            sequelize = new Sequelize(
                process.env.SOCIAL_DB_NAME,
                process.env.SOCIAL_DB_USER,
                process.env.SOCIAL_DB_PASSWORD,
                {
                    host: process.env.SOCIAL_DB_HOST,
                    port: parseInt(process.env.SOCIAL_DB_PORT) || 5432,
                    dialect: 'postgres',
                    logging: false,
                    pool: {
                        max: 20,
                        min: 5,
                        acquire: 30000,
                        idle: 10000
                    }
                }
            );
        } catch (error) {
            console.error('SEQUELIZE INIT ERROR:', error);
            throw error;
        }
    }
    return sequelize;
}

module.exports = function (app) {
    const sequelize = getSequelize();

    // We still use shared initializeDatabase if possible, or just sync
    sequelize.authenticate()
        .then(() => {
            logger.info('[Social Service] Database connected.');
            return sequelize.sync({ alter: true });

        })
        .then(() => {
            const PORT = process.env.SOCIAL_PORT || 3004;
            app.listen(PORT, () => {
                logger.info(`[Social Service] Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            logger.error('[Social Service] DB Error:', err);
            // Start anyway
            const PORT = process.env.SOCIAL_PORT || 3004;
            app.listen(PORT, () => {
                logger.warn(`[Social Service] Server running on port ${PORT} (NO DATABASE)`);
            });
        });
};

module.exports.getSequelize = getSequelize;
