const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Playlist = sequelize.define('Playlist', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        userId: { type: DataTypes.UUID, allowNull: false },
        isPublic: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        tableName: 'playlists',
        timestamps: true
    });

    return Playlist;
};

function validatePlaylist(playlist) {
    const schema = Joi.object({
        name: Joi.string().max(255).required(),
        description: Joi.string().optional(),
        userId: Joi.string().uuid().required(),
        isPublic: Joi.boolean().optional()
    });
    return schema.validate(playlist);
}

module.exports.validate = validatePlaylist;