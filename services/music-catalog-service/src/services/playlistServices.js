const { Playlist } = require('../models');

// Find all public playlists
async function findAllPublicPlaylists() {
    return await Playlist.findAll({
        where: { isPublic: true }
    });
}

// Find all playlists for a specific user
async function findUserPlaylists(userId) {
    return await Playlist.findAll({
        where: { userId }
    });
}

// Find playlist by ID
async function findPlaylistById(playlistId) {
    return await Playlist.findByPk(playlistId);
}

// Create new playlist
async function createNewPlaylist(playlistData, userId) {
    return await Playlist.create({
        ...playlistData,
        userId
    });
}

// Update playlist data
async function updatePlaylistData(playlist, updateData) {
    await playlist.update(updateData);
    return playlist;
}

// Delete playlist by ID
async function deletePlaylistById(playlist) {
    await playlist.destroy();
    return playlist;
}

module.exports = {
    findAllPublicPlaylists,
    findUserPlaylists,
    findPlaylistById,
    createNewPlaylist,
    updatePlaylistData,
    deletePlaylistById
};
