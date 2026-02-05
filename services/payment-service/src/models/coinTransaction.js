const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const CoinTransaction = sequelize.define('CoinTransaction', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        artistId: { type: DataTypes.STRING, allowNull: true },
        type: {
            type: DataTypes.ENUM('purchase', 'tip', 'spend', 'refund', 'bonus', 'subscription', 'earn'),
            allowNull: false
        },
        coinAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        fiatAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Amount in NGN or USD
        currency: { type: DataTypes.ENUM('NGN', 'USD'), defaultValue: 'NGN' },
        flutterwaveReference: { type: DataTypes.STRING, allowNull: true, unique: true },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
            defaultValue: 'pending'
        },
        metadata: { type: DataTypes.JSON, allowNull: true }, // {songId, albumId, subscriptionTier, etc.}
        description: { type: DataTypes.STRING(255), allowNull: true }
    }, {
        tableName: 'coin_transactions',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['flutterwaveReference']
            },
            {
                fields: ['status']
            }
        ]
    });

    return CoinTransaction;
};
