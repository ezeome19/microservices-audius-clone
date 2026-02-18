const { DataTypes } = require('sequelize');
const Joi = require('joi');

module.exports = function (sequelize) {
    const Comment = sequelize.define('Comment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        songId: { type: DataTypes.STRING, allowNull: false },
        parentId: { type: DataTypes.UUID, allowNull: true }, // For nested replies
        content: { type: DataTypes.TEXT, allowNull: false }
    }, {
        tableName: 'comments',
        timestamps: true
    });

    return Comment;
};

function validateComment(data) {
    const schema = Joi.object({
        content: Joi.string().min(1).max(1000),
        text: Joi.string().min(1).max(1000),
        parentId: Joi.string().guid({ version: 'uuidv4' }).allow(null)
    }).or('content', 'text'); // At least one must be present
    return schema.validate(data);
}

function validateCommentUpdate(data) {
    const schema = Joi.object({
        content: Joi.string().min(1).max(1000),
        text: Joi.string().min(1).max(1000),
        parentId: Joi.string().guid({ version: 'uuidv4' }).allow(null)
    }).or('content', 'text'); // At least one must be present
    return schema.validate(data);
}

module.exports.validate = validateComment;
module.exports.validateUpdate = validateCommentUpdate;
