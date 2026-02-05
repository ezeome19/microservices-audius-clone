const { logger } = require('../../../../shared');
const { initializeTimescaleDB } = require('../config/timescaledb');


module.exports = function (app) {
    initializeTimescaleDB()
        .then(() => {
            const PORT = process.env.ANALYTICS_PORT || 3007;
            app.listen(PORT, () => {
                logger.info(`[Analytics Service - ADMIN ONLY] Server running on port ${PORT}`);
            });
        })
        .catch(error => {
            logger.error('[Analytics Service] Failed to initialize:', error);
            process.exit(1);
        });
};
