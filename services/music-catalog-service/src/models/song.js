const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Song = sequelize.define('Song', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        duration: { type: DataTypes.INTEGER, allowNull: false },
        audioUrl: { type: DataTypes.STRING(500), allowNull: false },
        coverArtUrl: { type: DataTypes.STRING(500), allowNull: true },
        lyrics: { type: DataTypes.TEXT, allowNull: true },
        genre: { type: DataTypes.STRING(100), allowNull: true },
        tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] },
        releaseDate: { type: DataTypes.DATE, allowNull: true },
        albumId: { type: DataTypes.UUID, allowNull: true },
        artistId: { type: DataTypes.UUID, allowNull: false },
        // Social counters
        likeCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        playCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        repostCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        collaborators: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: true, defaultValue: [] },
        playCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        likeCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        repostCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        // Exclusive content (coin-gated)
        isExclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
        requiredCoins: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Coins needed to unlock
        exclusiveUntil: { type: DataTypes.DATE, allowNull: true } // Optional: make exclusive for limited time
    }, {
        tableName: 'songs',
        timestamps: true
    });

    return Song;
};

function validateSong(song) {
    const schema = Joi.object({
        title: Joi.string().max(255).required(),
        duration: Joi.number().integer().min(1).required(),
        audioUrl: Joi.string().max(500).optional(),
        coverArtUrl: Joi.string().max(500).optional(),
        lyrics: Joi.string().optional(),
        genre: Joi.string().max(100).optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        releaseDate: Joi.date().optional(),
        albumId: Joi.string().uuid().optional(),
        artistId: Joi.string().uuid().required(),
        collaborators: Joi.array().items(Joi.string().uuid()).optional()
    });
    return schema.validate(song);
}

module.exports.validate = validateSong;