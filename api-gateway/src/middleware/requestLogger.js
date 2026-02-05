const { logger } = require('../../../shared');

// Request logging middleware
// Logs all incoming requests to the API gateway
module.exports = function requestLogger(req, res, next) {
    logger.info(`[API Gateway] ${req.method} ${req.path}`);
    next();
};
