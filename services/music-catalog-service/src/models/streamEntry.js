const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
    const StreamEntry = sequelize.define('StreamEntry', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false },
        songId: { type: DataTypes.STRING, allowNull: false },
        playedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'stream_entries',
        timestamps: false,
        indexes: [
            { fields: ['userId'] },
            { fields: ['playedAt'] }
        ]
    });

    return StreamEntry;
};
