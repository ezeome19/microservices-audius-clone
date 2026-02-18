const { DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');

module.exports = function (sequelize) {
    const User = sequelize.define('User', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING(50), allowNull: false, validate: { len: [5, 50] } },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true, len: [0, 255] } },
        password: { type: DataTypes.STRING(1024), allowNull: false, validate: { len: [0, 1024] } },
        isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
        userType: { type: DataTypes.ENUM('consumer', 'merchant'), defaultValue: 'consumer' },
        artistName: { type: DataTypes.STRING(100), allowNull: true },
        recordLabel: { type: DataTypes.STRING(100), allowNull: true },
        isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        verifiedBy: { type: DataTypes.UUID, allowNull: true },
        verifiedAt: { type: DataTypes.DATE, allowNull: true },
        verificationToken: { type: DataTypes.STRING, allowNull: true },
        verificationTokenExpiry: { type: DataTypes.DATE, allowNull: true },
        isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        preferences: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
        // Audius-like profile fields
        profilePicture: { type: DataTypes.STRING(500), allowNull: true },
        coverPhoto: { type: DataTypes.STRING(500), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        location: { type: DataTypes.STRING(100), allowNull: true },
        website: { type: DataTypes.STRING(255), allowNull: true },
        twitter: { type: DataTypes.STRING(100), allowNull: true },
        instagram: { type: DataTypes.STRING(100), allowNull: true },
        favoriteGenres: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] },
        preferredArtists: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] }, // Artist IDs from signup
        followerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        followingCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        totalPlays: { type: DataTypes.INTEGER, defaultValue: 0 },
        upgradedAt: { type: DataTypes.DATE, allowNull: true }, // When consumer upgraded to merchant
        // Demographic fields
        age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13, max: 120 } },
        gender: { type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'), allowNull: true },
        nationality: { type: DataTypes.STRING(100), allowNull: true }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Instance methods
    User.prototype.generateAuthToken = function () {
        const token = jwt.sign(
            {
                id: this.id,
                name: this.name,
                email: this.email,
                isAdmin: this.isAdmin,
                userType: this.userType
            },
            process.env.JWT_PRIVATE_KEY,
            { expiresIn: '24h' }
        );
        return token;
    };

    User.prototype.generateToken = function () {
        return crypto.randomBytes(32).toString('hex');
    };

    User.prototype.getTokenExpiry = function () {
        return new Date(Date.now() + 3600000); // 1 hour
    };

    return User;
};


// Joi validation functions
function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(0).max(255).required().email(),
        password: Joi.string().min(6).max(255).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).optional().messages({
            'any.only': 'Passwords do not match'
        }),
        userType: Joi.string().valid('consumer', 'merchant').optional(),
        age: Joi.number().integer().min(13).max(120).optional(),
        gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
        nationality: Joi.string().max(100).optional()
    });
    return schema.validate(user);
}

function validateLogin(req) {
    const schema = Joi.object({
        email: Joi.string().min(0).max(255).required().email(),
        password: Joi.string().min(0).max(255).required()
    });
    return schema.validate(req);
}

function validateProfileUpdate(req) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).optional(),
        email: Joi.string().min(0).max(255).optional().email(),
        bio: Joi.string().allow('', null).optional(),
        location: Joi.string().allow('', null).optional(),
        website: Joi.string().allow('', null).optional(),
        twitter: Joi.string().allow('', null).optional(),
        instagram: Joi.string().allow('', null).optional(),
        profilePicture: Joi.string().allow('', null).optional(),
        coverPhoto: Joi.string().allow('', null).optional(),
        artistName: Joi.string().min(1).max(100).optional(),
        recordLabel: Joi.string().min(1).max(100).optional(),
        age: Joi.number().integer().min(13).max(120).optional(),
        gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
        nationality: Joi.string().max(100).optional()
    });
    return schema.validate(req);
}

function validatePasswordResetRequest(req) {
    const schema = Joi.object({
        email: Joi.string().min(0).max(255).required().email()
    });
    return schema.validate(req);
}

function validatePasswordReset(req) {
    const schema = Joi.object({
        password: Joi.string().min(0).max(255).required()
    });
    return schema.validate(req);
}

function validateMerchantSignup(req) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(0).max(255).required().email(),
        password: Joi.string().min(0).max(255).required(),
        artistName: Joi.string().min(1).max(100).optional(),
        recordLabel: Joi.string().min(1).max(100).optional()
    }).or('artistName', 'recordLabel'); // At least one must be provided
    return schema.validate(req);
}

function validateMerchantVerification(req) {
    const schema = Joi.object({
        merchantId: Joi.string().uuid().required()
    });
    return schema.validate(req);
}

function validatePreferences(req) {
    const schema = Joi.object({
        favoriteGenres: Joi.array().items(Joi.string().max(50)).max(20).optional(),
        favoriteArtists: Joi.array().items(Joi.string().max(100)).max(50).optional(),
        preferredArtists: Joi.array().items(Joi.string()).min(0).max(10).optional(), // Artist IDs from onboarding
        preferredMoods: Joi.array().items(Joi.string().max(50)).max(20).optional(),
        languagePreference: Joi.string().length(2).optional(),
        explicitContent: Joi.boolean().optional()
    });
    return schema.validate(req);
}


function validateAccountUpgrade(req) {
    const schema = Joi.object({
        artistName: Joi.string().min(1).max(100).optional(),
        recordLabel: Joi.string().min(1).max(100).optional(),
        bio: Joi.string().max(500).optional(),
        website: Joi.string().uri().optional()
    }).or('artistName', 'recordLabel'); // At least one must be provided
    return schema.validate(req);
}

// Export validation functions
module.exports.validate = validateUser;
module.exports.validateLogin = validateLogin;
module.exports.validateProfileUpdate = validateProfileUpdate;
module.exports.validatePasswordResetRequest = validatePasswordResetRequest;
module.exports.validatePasswordReset = validatePasswordReset;
module.exports.validateMerchantSignup = validateMerchantSignup;
module.exports.validateMerchantVerification = validateMerchantVerification;
module.exports.validatePreferences = validatePreferences;
module.exports.validateAccountUpgrade = validateAccountUpgrade;
