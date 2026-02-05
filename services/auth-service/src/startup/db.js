const { createDbConnection, initializeDatabase, logger } = require('../../../../shared');

let sequelize;

function getSequelize() {
    if (!sequelize) {
        // Database configuration from environment variables
        // This is now called ONLY when getSequelize is invoked, 
        // which should be AFTER dotenv is loaded by either app.js or test-helper.js


        const dbConfig = {
            database: process.env.AUTH_DB_NAME,
            username: process.env.AUTH_DB_USER,
            password: process.env.AUTH_DB_PASSWORD,
            host: process.env.AUTH_DB_HOST,
            port: parseInt(process.env.AUTH_DB_PORT) || 5432
        };

        sequelize = createDbConnection(dbConfig, 'Auth Service');
    }
    return sequelize;
}

module.exports = function (app) {
    // Don't initialize database (connect/sync) in test mode automatically
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    const seq = getSequelize();
    initializeDatabase(seq, 'Auth Service')
        .then(() => {
            // Start the server after database is ready
            const PORT = process.env.AUTH_PORT || 3001;
            app.listen(PORT, () => {
                logger.info(`[Auth Service] Server running on port ${PORT}`);
            });
        })
        .catch(error => {
            logger.error('[Auth Service] Failed to initialize:', error);
            process.exit(1);
        });
};

// Export singleton getter
module.exports.getSequelize = getSequelize;
// Keep direct export for backward compatibility if unavoidable, but it might be null if accessed too early
// Better to force consumers to use getSequelize() or rely on this module being required AFTER environment setup.
Object.defineProperty(module.exports, 'sequelize', {
    get: getSequelize
});
