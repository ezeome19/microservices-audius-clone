const winston = require('winston');

// Custom format for redacting sensitive information
const redact = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'jwt', 'authorization', 'signature'];

    const redactObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

        for (const key in redacted) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                redacted[key] = '[REDACTED]';
            } else if (typeof redacted[key] === 'object') {
                redacted[key] = redactObject(redacted[key]);
            }
        }
        return redacted;
    };

    return redactObject(info);
});

// Winston logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        redact(), // Apply redaction BEFORE other formats
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'audius-clone-demo' },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, service }) => {
                    return `${timestamp} [${service}] ${level}: ${message}`;
                })
            )
        }),
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: 'error.log',
            level: 'error'
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: 'combined.log'
        })
    ]
});

// Handle uncaught exceptions
logger.exceptions.handle(
    new winston.transports.File({ filename: 'exceptions.log' })
);

// Handle unhandled promise rejections
logger.rejections.handle(
    new winston.transports.File({ filename: 'rejections.log' })
);

module.exports = logger;
