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
        // Don't exit immediately; let the service stay alive for other requests
        // only exit if it's a critical infrastructure failure
        if (ex.message && ex.message.includes('ECONNREFUSED')) {
            console.error('CRITICAL: Database connection lost. Exiting...');
            process.exit(1);
        }
    });
};
