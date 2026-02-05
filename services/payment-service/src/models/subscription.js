const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const Subscription = sequelize.define('Subscription', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        tier: {
            type: DataTypes.STRING, // Using STRING for flexibility with new tiers
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'),
            defaultValue: 'pending'
        },
        startDate: { type: DataTypes.DATE, allowNull: true },
        endDate: { type: DataTypes.DATE, allowNull: true },
        autoRenew: { type: DataTypes.BOOLEAN, defaultValue: false },
        artistCoinsIncluded: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true }, // Artist IDs
        flutterwaveReference: { type: DataTypes.STRING, allowNull: true, unique: true },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        currency: { type: DataTypes.STRING, defaultValue: 'NGN' }
    }, {
        tableName: 'subscriptions',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['status']
            }
        ]
    });

    return Subscription;
};
