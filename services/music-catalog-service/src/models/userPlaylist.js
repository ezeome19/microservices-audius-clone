const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const UserPlaylist = sequelize.define('UserPlaylist', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
        coverArtUrl: { type: DataTypes.STRING(500), allowNull: true },
        tracks: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
            // Array of { audiusTrackId, addedAt, addedBy }
        }
    }, {
        tableName: 'user_playlists',
        timestamps: true
    });

    return UserPlaylist;
};

function validatePlaylist(playlist) {
    const schema = Joi.object({
        name: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(1000).optional(),
        isPublic: Joi.boolean().optional(),
        coverArtUrl: Joi.string().uri().max(500).optional()
    });
    return schema.validate(playlist);
}

function validatePlaylistUpdate(playlist) {
    const schema = Joi.object({
        name: Joi.string().min(1).max(255).optional(),
        description: Joi.string().max(1000).optional(),
        isPublic: Joi.boolean().optional(),
        coverArtUrl: Joi.string().uri().max(500).optional()
    });
    return schema.validate(playlist);
}

function validateAddTrack(data) {
    const schema = Joi.object({
        audiusTrackId: Joi.string().required()
    });
    return schema.validate(data);
}

module.exports.validate = validatePlaylist;
module.exports.validateUpdate = validatePlaylistUpdate;
module.exports.validateAddTrack = validateAddTrack;
