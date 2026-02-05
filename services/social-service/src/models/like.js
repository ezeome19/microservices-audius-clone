const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Like = sequelize.define('Like', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        songId: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'likes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'songId']
            }
        ]
    });

    return Like;
};

function validateLike(data) {
    const schema = Joi.object({
        songId: Joi.string().required()
    });
    return schema.validate(data);
}

module.exports.validate = validateLike;
