const { DataTypes } = require('sequelize');
const { getSequelize } = require('../startup/db');

// Lazy load sequelize instance
module.exports = function (sequelize) {
    if (!sequelize) sequelize = getSequelize();

    return sequelize.define('Transaction', {
        userId: { type: DataTypes.STRING, allowNull: false }, // MongoDB ObjectID
        externalId: { type: DataTypes.STRING, unique: true },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'NGN' },
        status: {
            type: DataTypes.ENUM('pending', 'successful', 'failed'),
            defaultValue: 'pending'
        },
        reference: { type: DataTypes.STRING, allowNull: false, unique: true }
    });
};
