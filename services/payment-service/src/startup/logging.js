const { logger } = require('../../../../shared');


module.exports = function () {
    // Handle uncaught exceptions
    process.on('uncaughtException', (ex) => {
        logger.error('Uncaught Exception:', ex);
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (ex) => {
        logger.error('Unhandled Rejection:', ex);
        process.exit(1);
    });
};
