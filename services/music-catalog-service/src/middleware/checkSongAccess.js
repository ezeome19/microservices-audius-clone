const { Song } = require('../models');


async function checkSongAccess(req, res, next) {
    try {
        const song = await Song.findByPk(req.params.id);

        if (!song) {
            return res.status(404).json('Song not found');
        }

        // For now, only admins can modify songs
        // In a real app, you'd check if user is the artist or has rights
        if (!req.user.isAdmin) {
            return res.status(403).json('Access denied. Only admins can modify songs.');
        }

        // Attach song to request for use in controller
        req.song = song;
        next();
    } catch (error) {
        res.status(500).json('Error checking song access');
    }
}

module.exports = checkSongAccess;
