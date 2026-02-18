const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Like = sequelize.define('Like', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        songId: { type: DataTypes.STRING, allowNull: true },
        commentId: { type: DataTypes.UUID, allowNull: true }
    }, {
        tableName: 'likes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'songId'],
                where: {
                    songId: { [sequelize.Sequelize.Op.ne]: null }
                }
            },
            {
                unique: true,
                fields: ['userId', 'commentId'],
                where: {
                    commentId: { [sequelize.Sequelize.Op.ne]: null }
                }
            }
        ]
    });

    return Like;
};

function validateLike(data) {
    const schema = Joi.object({
        songId: Joi.string().allow(null),
        commentId: Joi.string().guid({ version: 'uuidv4' }).allow(null)
    }).or('songId', 'commentId');
    return schema.validate(data);
}

module.exports.validate = validateLike;
