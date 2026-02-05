const { createDbConnection, initializeDatabase, logger } = require('../../../../shared');
const { Sequelize } = require('sequelize');

let sequelize;

function getSequelize() {
    if (!sequelize) {
        const dbConfig = {
            database: process.env.PAYMENT_DB_NAME,
            username: process.env.PAYMENT_DB_USER,
            password: process.env.PAYMENT_DB_PASSWORD,
            host: process.env.PAYMENT_DB_HOST,
            port: parseInt(process.env.PAYMENT_DB_PORT) || 5432,
            dialect: 'postgres'
        };
        sequelize = createDbConnection(dbConfig, 'Payment Service');
    }
    return sequelize;
}

module.exports = function (app) {
    const sequelize = getSequelize();

    initializeDatabase(sequelize, 'Payment Service')
        .then(() => {
            const PORT = process.env.PAYMENT_PORT || 3005;
            app.listen(PORT, () => {
                logger.info(`[Payment Service] Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            logger.error('[Payment Service] DB Connection Failed:', err);
            const PORT = process.env.PAYMENT_PORT || 3005;
            app.listen(PORT, () => {
                logger.warn(`[Payment Service] Server running on port ${PORT} (NO DATABASE)`);
            });
        });
};

module.exports.getSequelize = getSequelize;
