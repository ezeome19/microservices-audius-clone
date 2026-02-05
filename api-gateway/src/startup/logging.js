const { logger } = require('../../../shared');

module.exports = function () {
    // Handle uncaught exceptions
    process.on('uncaughtException', (ex) => {
        logger.error('Uncaught Exception:', ex);
        setTimeout(() => process.exit(1), 200);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (ex) => {
        logger.error('Unhandled Rejection:', ex);
        setTimeout(() => process.exit(1), 200);
    });

    logger.info('[API Gateway] Logging initialized');
};
