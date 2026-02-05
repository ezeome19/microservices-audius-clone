const { Album } = require('../models');


async function checkAlbumOwner(req, res, next) {
    try {
        const album = await Album.findByPk(req.params.id);

        if (!album) {
            return res.status(404).json('Album not found');
        }

        // Only admins can modify albums
        // In a real app, you'd check if user is the artist or has rights
        if (!req.user.isAdmin) {
            return res.status(403).json('Access denied. Only admins can modify albums.');
        }

        // Attach album to request for use in controller
        req.album = album;
        next();
    } catch (error) {
        res.status(500).json('Error checking album ownership');
    }
}

module.exports = checkAlbumOwner;
