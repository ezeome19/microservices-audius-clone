const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const ArtistEarnings = sequelize.define('ArtistEarnings', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        artistId: { type: DataTypes.STRING, allowNull: false, unique: true },
        availableBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Can withdraw now
        pendingBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Locked for 7 days
        lifetimeEarnings: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        totalWithdrawn: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        currency: { type: DataTypes.ENUM('NGN', 'USD'), defaultValue: 'NGN' },
        lastPayout: { type: DataTypes.DATE, allowNull: true },
        bankDetails: { type: DataTypes.JSON, allowNull: true } // {accountNumber, bankCode, accountName}
    }, {
        tableName: 'artist_earnings',
        timestamps: true,
        indexes: [
            {
                fields: ['artistId']
            }
        ]
    });

    return ArtistEarnings;
};
