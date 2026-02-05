const { Playlist } = require('../models');

async function checkPlaylistOwner(req, res, next) {
    try {
        const playlist = await Playlist.findByPk(req.params.id);

        if (!playlist) {
            return res.status(404).json('Playlist not found');
        }

        // Check if the authenticated user owns this playlist
        if (playlist.userId !== req.user.id) {
            return res.status(403).json('Access denied. You do not own this playlist.');
        }

        // Attach playlist to request for use in controller
        req.playlist = playlist;
        next();
    } catch (error) {
        res.status(500).json('Error checking playlist ownership');
    }
}

module.exports = checkPlaylistOwner;
