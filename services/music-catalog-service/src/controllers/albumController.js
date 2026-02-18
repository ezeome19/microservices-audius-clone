const {
    findAllAlbums,
    findAlbumById,
    createNewAlbum,
    updateAlbumData,
    deleteAlbumById
} = require('../services/albumServices');


// Get all albums
async function getAllAlbums(req, res) {
    const albums = await findAllAlbums();
    res.json({
        message: 'Albums retrieved successfully',
        albums
    });
}

// Get album by ID
async function getAlbumById(req, res) {
    const album = await findAlbumById(req.params.id);

    if (!album) {
        return res.status(404).json({ message: 'Album not found' });
    }

    res.json({
        message: 'Album retrieved successfully',
        album
    });
}

// Create new album
async function createAlbum(req, res) {
    const album = await createNewAlbum(req.body);
    res.json({
        message: 'Album created successfully',
        album
    });
}

// Update album
async function updateAlbum(req, res) {
    // req.album is attached by checkAlbumOwner middleware
    const updatedAlbum = await updateAlbumData(req.album, req.body);
    res.json({
        message: 'Album updated successfully',
        album: updatedAlbum
    });
}

// Delete album
async function deleteAlbum(req, res) {
    // req.album is attached by checkAlbumOwner middleware
    const deletedAlbum = await deleteAlbumById(req.album);
    res.json({
        message: 'Album deleted successfully',
        album: deletedAlbum
    });
}

module.exports = {
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum
};
