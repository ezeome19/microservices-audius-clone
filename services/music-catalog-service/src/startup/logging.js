const { logger } = require('../../../../shared');

module.exports = function () {
    process.on('uncaughtException', (ex) => {
        logger.error('[Music Catalog] Uncaught Exception:', ex);
        process.exit(1);
    });

    process.on('unhandledRejection', (ex) => {
        logger.error('[Music Catalog] Unhandled Rejection:', ex);
        process.exit(1);
    });
};
