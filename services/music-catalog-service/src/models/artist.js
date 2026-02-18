const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Artist = sequelize.define('Artist', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        audiusId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
        userId: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        bio: { type: DataTypes.TEXT, allowNull: true },
        profilePicture: { type: DataTypes.STRING(500), allowNull: true },
        coverPhoto: { type: DataTypes.STRING(500), allowNull: true },
        // Social counter
        followerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        totalPlays: { type: DataTypes.INTEGER, defaultValue: 0 },
        tier: { type: DataTypes.STRING(50), allowNull: true },
        isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        socialLinks: { type: DataTypes.JSON, allowNull: true }
    }, {
        tableName: 'artists',
        timestamps: true
    });

    return Artist;
};

function validateArtist(artist) {
    const schema = Joi.object({
        audiusId: Joi.string().max(255).optional(),
        userId: Joi.string().uuid().optional(),
        name: Joi.string().max(255).required(),
        bio: Joi.string().optional(),
        profileImageUrl: Joi.string().max(500).optional(),
        socialLinks: Joi.object({
            twitter: Joi.string().uri().optional(),
            instagram: Joi.string().uri().optional(),
            website: Joi.string().uri().optional()
        }).optional()
    });
    return schema.validate(artist);
}

module.exports.validate = validateArtist;