const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const ArtistCoin = sequelize.define('ArtistCoin', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        artistId: { type: DataTypes.STRING, allowNull: false, unique: true }, // References Artist from Music Catalog
        coinName: { type: DataTypes.STRING(100), allowNull: false }, // "Drake Coins"
        coinSymbol: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // "DRA"
        pricePerCoin: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 20.00 }, // NGN price
        pricePerCoinUSD: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0.025 }, // USD price
        totalSupply: { type: DataTypes.INTEGER, defaultValue: 1000000 }, // Max coins available
        circulatingSupply: { type: DataTypes.INTEGER, defaultValue: 0 }, // Coins in user wallets
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        metadata: { type: DataTypes.JSON, allowNull: true } // Extra info (logo, description, etc.)
    }, {
        tableName: 'artist_coins',
        timestamps: true
    });

    return ArtistCoin;
};

// Joi validation
function validateArtistCoin(data) {
    const schema = Joi.object({
        artistId: Joi.string().required(),
        coinName: Joi.string().max(100).required(),
        coinSymbol: Joi.string().max(10).required(),
        pricePerCoin: Joi.number().min(0).max(1000),
        pricePerCoinUSD: Joi.number().min(0).max(10)
    });
    return schema.validate(data);
}

module.exports.validateArtistCoin = validateArtistCoin;
