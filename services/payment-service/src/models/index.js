const { getSequelize } = require('../startup/db');

let models = null;

module.exports = new Proxy({}, {
    get: function (target, prop) {
        if (!models) {
            const sequelize = getSequelize();
            const Transaction = require('./transaction')(sequelize);
            const ArtistCoin = require('./artistCoin')(sequelize);
            const CoinWallet = require('./coinWallet')(sequelize);
            const CoinTransaction = require('./coinTransaction')(sequelize);
            const ArtistEarnings = require('./artistEarnings')(sequelize);
            const Subscription = require('./subscription')(sequelize);

            models = {
                sequelize,
                Transaction,
                ArtistCoin,
                CoinWallet,
                CoinTransaction,
                ArtistEarnings,
                Subscription
            };
        }
        return models[prop];
    }
});
