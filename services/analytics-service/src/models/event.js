const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/timescaledb');


const Event = sequelize.define('Event', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, primaryKey: true },
    eventType: { type: DataTypes.STRING(50), allowNull: false, comment: 'song_played, song_liked, playlist_created, etc.' },
    userId: { type: DataTypes.UUID, allowNull: false, index: true },
    songId: { type: DataTypes.STRING, allowNull: true, index: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, comment: 'Additional event data' },
    device: { type: DataTypes.STRING(20), allowNull: true },
    location: { type: DataTypes.STRING(100), allowNull: true }
}, {
    tableName: 'events',
    timestamps: false,
    indexes: [
        { fields: ['timestamp', 'eventType'] },
        { fields: ['userId', 'timestamp'] },
        { fields: ['songId', 'timestamp'] }
    ]
});

module.exports = Event;