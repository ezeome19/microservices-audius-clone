const { logger } = require('../../../shared');

module.exports = function (app) {
    const PORT = process.env.GATEWAY_PORT || 3000;

    app.listen(PORT, () => {
        logger.info(`[API Gateway] Server running on port ${PORT}`);
        logger.info(`[API Gateway] Proxying to microservices`);
    });
};
