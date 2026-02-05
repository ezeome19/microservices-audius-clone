const { getSequelize } = require('../startup/db');

let models = null;

module.exports = new Proxy({}, {
    get: function (target, prop) {
        if (!models) {
            const sequelize = getSequelize();
            const Song = require('./song')(sequelize);
            const Album = require('./album')(sequelize);
            const Artist = require('./artist')(sequelize);
            const StreamEntry = require('./streamEntry')(sequelize);
            const Playlist = require('./playlist')(sequelize);
            const UserPlaylist = require('./userPlaylist')(sequelize);
            const UserContentAccess = require('./userContentAccess')(sequelize);

            // Define associations
            Artist.hasMany(Album, { foreignKey: 'artistId', as: 'albums' });
            Album.belongsTo(Artist, { foreignKey: 'artistId', as: 'artist' });
            Artist.hasMany(Song, { foreignKey: 'artistId', as: 'songs' });
            Song.belongsTo(Artist, { foreignKey: 'artistId', as: 'artist' });
            Album.hasMany(Song, { foreignKey: 'albumId', as: 'songs' });
            Song.belongsTo(Album, { foreignKey: 'albumId', as: 'album' });

            models = {
                sequelize,
                Song,
                Album,
                Artist,
                Playlist,
                UserPlaylist,
                UserContentAccess,
                StreamEntry
            };
        }
        return models[prop];
    }
});
