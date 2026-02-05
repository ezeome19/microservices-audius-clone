const { Song } = require('../models');

// Find all songs with artist and album information
async function findAllSongs() {
    return await Song.findAll({
        include: ['artist', 'album']
    });
}

// Find song by ID with artist and album information
async function findSongById(songId) {
    const { validate: validateUUID } = require('uuid');
    if (!validateUUID(songId)) {
        return null;
    }
    return await Song.findByPk(songId, {
        include: ['artist', 'album']
    });
}

// Create new song
async function createNewSong(songData) {
    return await Song.create(songData);
}

// Update song data
async function updateSongData(song, updateData) {
    await song.update(updateData);
    return song;
}

// Delete song
async function deleteSongById(song) {
    await song.destroy();
    return song;
}

module.exports = {
    findAllSongs,
    findSongById,
    createNewSong,
    updateSongData,
    deleteSongById
};
