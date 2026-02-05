const { getSequelize } = require('../startup/db');

let models = null;

module.exports = new Proxy({}, {
    get: function (target, prop) {
        if (!models) {
            const sequelize = getSequelize();
            const Follow = require('./follow')(sequelize);
            const Repost = require('./repost')(sequelize);
            const Comment = require('./comment')(sequelize);
            const Like = require('./like')(sequelize);

            models = {
                sequelize,
                Follow,
                Repost,
                Comment,
                Like
            };
        }
        return models[prop];
    }
});
