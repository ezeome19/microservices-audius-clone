/**
 * Centralized configuration validation utility
 * Checks for mandatory environment variables required for service startup
 */
module.exports = function validateConfig() {
    const requiredVars = [
        'JWT_PRIVATE_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        const errorMsg = `FATAL ERROR: Essential configuration missing: ${missing.join(', ')}. The application cannot start safely.`;
        console.error('\x1b[31m%s\x1b[0m', errorMsg); // Log in red
        throw new Error(errorMsg);
    }
};
