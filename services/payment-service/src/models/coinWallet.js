const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const CoinWallet = sequelize.define('CoinWallet', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false }, // References User from Auth Service
        artistId: { type: DataTypes.STRING, allowNull: true }, // null = general wallet, otherwise specific artist
        balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, // Legacy/Total A-Tokens
        balanceUSD: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        balanceNGN: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        lifetimeEarned: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Total coins ever received
        lifetimeSpent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Total coins ever spent
        lastTransaction: { type: DataTypes.DATE, allowNull: true }
    }, {
        tableName: 'coin_wallets',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'artistId']
            },
            {
                fields: ['userId']
            }
        ]
    });

    return CoinWallet;
};
