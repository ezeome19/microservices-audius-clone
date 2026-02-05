const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Repost = sequelize.define('Repost', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        songId: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'reposts',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'songId']
            }
        ]
    });

    return Repost;
};

function validateRepost(data) {
    const schema = Joi.object({
        songId: Joi.string().required()
    });
    return schema.validate(data);
}

module.exports.validate = validateRepost;
