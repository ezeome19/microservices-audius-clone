const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const UserContentAccess = sequelize.define('UserContentAccess', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false, field: 'userId' },
        contentId: { type: DataTypes.UUID, allowNull: false }, // songId or albumId
        contentType: { type: DataTypes.ENUM('song', 'album', 'playlist'), allowNull: false },
        artistId: { type: DataTypes.UUID, allowNull: false },
        accessType: { type: DataTypes.ENUM('purchased', 'subscription', 'free'), defaultValue: 'purchased' },
        coinsSpent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        expiresAt: { type: DataTypes.DATE, allowNull: true } // Optional: time-limited access
    }, {
        tableName: 'user_content_access',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'contentId', 'contentType']
            },
            {
                fields: ['userId']
            }
        ]
    });

    return UserContentAccess;
};
