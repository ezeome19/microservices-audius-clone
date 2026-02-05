const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Album = sequelize.define('Album', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        coverImageUrl: { type: DataTypes.STRING(500), allowNull: true },
        releaseDate: { type: DataTypes.DATE, allowNull: true },
        artistId: { type: DataTypes.UUID, allowNull: false },
        // Exclusive content (coin-gated)
        isExclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
        requiredCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
    }, {
        tableName: 'albums',
        timestamps: true
    });
    return Album;
};

function validateAlbum(album) {
    const schema = Joi.object({
        title: Joi.string().max(255).required(),
        coverImageUrl: Joi.string().max(500).optional(),
        releaseDate: Joi.date().optional(),
        artistId: Joi.string().uuid().required()
    });
    return schema.validate(album);
}

module.exports.validate = validateAlbum;