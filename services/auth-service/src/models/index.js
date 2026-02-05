const { getSequelize } = require('../startup/db');

let models = null;

module.exports = new Proxy({}, {
    get: function (target, prop) {
        if (!models) {
            const sequelize = getSequelize();
            const User = require('./user')(sequelize);
            models = { sequelize, User };
        }
        return models[prop];
    }
});
