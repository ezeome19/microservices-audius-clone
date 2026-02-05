const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Follow = sequelize.define('Follow', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        followerId: { type: DataTypes.STRING, allowNull: false },
        followingId: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'follows',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['followerId', 'followingId']
            }
        ]
    });

    return Follow;
};

function validateFollow(data) {
    const schema = Joi.object({
        followingId: Joi.string().required()
    });
    return schema.validate(data);
}

module.exports.validate = validateFollow;
