const logger = require('../utils/logger');

module.exports = function (err, req, res, next) {
    logger.error(err.message, { stack: err.stack });

    // Handle Mongoose or custom validation errors
    if (err.name === 'ValidationError' || err.code === 11000) {
        return res.status(400).json({
            message: err.message,
            error: 'Bad Request'
        });
    }

    res.status(500).json({ message: 'Something went wrong on the server. Please try again later.' });
};
