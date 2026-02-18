const { createDbConnection, initializeDatabase } = require('../../../../shared');
const { logger } = require('../../../../shared');

let sequelize;

function getSequelize() {
    if (!sequelize) {
        const dbConfig = {
            database: process.env.MUSIC_DB_NAME,
            username: process.env.MUSIC_DB_USER,
            password: process.env.MUSIC_DB_PASSWORD,
            host: process.env.MUSIC_DB_HOST,
            port: parseInt(process.env.MUSIC_DB_PORT) || 5432
        };

        sequelize = createDbConnection(dbConfig, 'Music Catalog Service');
    }
    return sequelize;
}

module.exports = function (app) {
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    const sequelize = getSequelize();

    // Test connection and sync
    initializeDatabase(sequelize, 'Music Catalog Service')
        .then(() => {
            const PORT = process.env.MUSIC_PORT || 3002;
            app.listen(PORT, () => {
                logger.info(`[Music Catalog Service] Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            logger.error('[Music Catalog Service] Failed to connect to database:', err);
            // Start anyway in development to prevent gateway ECONNREFUSED
            const PORT = process.env.MUSIC_PORT || 3002;
            app.listen(PORT, () => {
                logger.warn(`[Music Catalog Service] Server running on port ${PORT} (NO DATABASE)`);
            });
        });
};

module.exports.sequelize = sequelize;

module.exports.getSequelize = getSequelize;
