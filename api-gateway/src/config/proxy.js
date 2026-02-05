const { logger } = require('../../../shared');


module.exports = {
    changeOrigin: true,
    // No path rewriting - forward the full path to services
    // Services handle their own /api/* routes
    on: {
        error: (err, req, res) => {
            logger.error(`[API Gateway] Proxy error: ${err.message}`);
            res.status(503).json({ error: 'Service unavailable' });
        },
        proxyReq: (proxyReq, req, res) => {
            // Log proxy requests
            logger.info(`[Proxy] ${req.method} ${req.path} -> ${proxyReq.path}`);

            // Automatically forward token from cookie to x-auth-token header
            const token = req.cookies && req.cookies.token;
            if (token && !req.headers['x-auth-token']) {
                proxyReq.setHeader('x-auth-token', token);
            }
        }

    }
};
