const { Sequelize } = require('sequelize');

/**
 * Transaction Middleware Factory - Creates a middleware that automatically wraps requests in a database transaction
 * 
 * Usage:
 * const { sequelize } = require('../models');
 * router.post('/verify', authMiddleware, withTransaction(sequelize), verifyPayment);
 * 
 * In your controller, access the transaction via req.dbTransaction
 */
const withTransaction = (sequelize) => async (req, res, next) => {
    if (!sequelize) {
        console.error('withTransaction: No sequelize instance provided');
        return next();
    }

    // Start a new transaction
    req.dbTransaction = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    // Store original res.json and res.status to auto-commit/rollback
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;

    // Override res.status to capture status code
    res.status = (code) => {
        statusCode = code;
        return originalStatus(code);
    };

    // Override res.json to auto-commit or rollback
    res.json = async (data) => {
        try {
            // Commit on success (2xx status codes)
            if (statusCode >= 200 && statusCode < 300) {
                if (req.dbTransaction && !req.dbTransaction.finished) {
                    await req.dbTransaction.commit();
                }
            } else {
                // Rollback on error (4xx, 5xx status codes)
                if (req.dbTransaction && !req.dbTransaction.finished) {
                    await req.dbTransaction.rollback();
                }
            }
        } catch (error) {
            console.error('Transaction middleware error:', error);
            if (req.dbTransaction && !req.dbTransaction.finished) {
                await req.dbTransaction.rollback();
            }
        }
        return originalJson(data);
    };

    // Handle errors in the route handler
    const originalNext = next;
    next = async (err) => {
        if (err && req.dbTransaction && !req.dbTransaction.finished) {
            await req.dbTransaction.rollback();
        }
        originalNext(err);
    };

    next();
};

/**
 * Transaction Utility - Provides helper functions for manual transaction management
 * 
 * Usage:
 * const { withDbTransaction, lockRow } = require('shared/middleware/transaction');
 * const { sequelize, CoinWallet } = require('../models');
 * 
 * await withDbTransaction(sequelize, async (transaction) => {
 *     const wallet = await lockRow(CoinWallet, { userId, artistId }, transaction);
 *     await wallet.increment({ balance: 100 }, { transaction });
 * });
 */

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 * 
 * @param {Object} sequelize - Sequelize instance
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise<any>} - Result of the callback function
 */
async function withDbTransaction(sequelize, callback) {
    if (!sequelize) throw new Error('withDbTransaction: No sequelize instance provided');

    const transaction = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
        const result = await callback(transaction);
        if (!transaction.finished) await transaction.commit();
        return result;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}

/**
 * Lock a row for update within a transaction
 * Prevents race conditions by ensuring exclusive access
 * 
 * @param {Model} Model - Sequelize model
 * @param {Object} where - Where clause to find the row
 * @param {Transaction} transaction - Database transaction
 * @returns {Promise<Model|null>} - Locked model instance or null
 */
async function lockRow(Model, where, transaction) {
    return await Model.findOne({
        where,
        lock: Sequelize.Transaction.LOCK.UPDATE,
        transaction
    });
}

/**
 * Lock a row by primary key for update within a transaction
 * 
 * @param {Model} Model - Sequelize model
 * @param {string|number} id - Primary key value
 * @param {Transaction} transaction - Database transaction
 * @returns {Promise<Model|null>} - Locked model instance or null
 */
async function lockRowById(Model, id, transaction) {
    return await Model.findByPk(id, {
        lock: Sequelize.Transaction.LOCK.UPDATE,
        transaction
    });
}

/**
 * Ensure idempotency - check if operation was already completed
 * 
 * @param {Model} record - Database record to check
 * @param {string} statusField - Field name to check (e.g., 'status')
 * @param {string} completedValue - Value indicating completion (e.g., 'completed', 'active')
 * @returns {boolean} - True if already completed
 */
function isAlreadyProcessed(record, statusField = 'status', completedValue = 'completed') {
    return record && record[statusField] === completedValue;
}

/**
 * Safe increment - increment a field within a transaction
 * 
 * @param {Model} model - Model instance
 * @param {Object} fields - Fields to increment { fieldName: amount }
 * @param {Transaction} transaction - Database transaction
 */
async function safeIncrement(model, fields, transaction) {
    return await model.increment(fields, { transaction });
}

/**
 * Safe decrement - decrement a field within a transaction
 * 
 * @param {Model} model - Model instance
 * @param {string} field - Field name to decrement
 * @param {number} amount - Amount to decrement
 * @param {Transaction} transaction - Database transaction
 */
async function safeDecrement(model, field, amount, transaction) {
    return await model.decrement(field, { by: amount, transaction });
}

module.exports = {
    // Middleware
    withTransaction,

    // Utility functions
    withDbTransaction,
    lockRow,
    lockRowById,
    isAlreadyProcessed,
    safeIncrement,
    safeDecrement
};
