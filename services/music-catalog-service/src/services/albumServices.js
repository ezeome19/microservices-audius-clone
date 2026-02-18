const { Album } = require('../models');

// Find all albums with artist and songs information
async function findAllAlbums() {
    return await Album.findAll({
        include: ['artist', 'songs']
    });
}

// Find album by ID with artist and songs information
async function findAlbumById(albumId) {
    return await Album.findByPk(albumId, {
        include: ['artist', 'songs']
    });
}

// Create new album
async function createNewAlbum(albumData) {
    return await Album.create(albumData);
}

// Update album data
async function updateAlbumData(album, updateData) {
    await album.update(updateData);
    return album;
}

// Delete album
async function deleteAlbumById(album) {
    await album.destroy();
    return album;
}

module.exports = {
    findAllAlbums,
    findAlbumById,
    createNewAlbum,
    updateAlbumData,
    deleteAlbumById
};
