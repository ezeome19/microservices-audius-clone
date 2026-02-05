const { Artist } = require('../models');

async function checkArtistOwner(req, res, next) {
    try {
        const artist = await Artist.findByPk(req.params.id);

        if (!artist) {
            return res.status(404).json('Artist not found');
        }

        // Only admins can modify artist profiles
        // In a real app, you'd check if user is the artist themselves
        if (!req.user.isAdmin) {
            return res.status(403).json('Access denied. Only admins can modify artist profiles.');
        }

        // Attach artist to request for use in controller
        req.artist = artist;
        next();
    } catch (error) {
        res.status(500).json('Error checking artist ownership');
    }
}

module.exports = checkArtistOwner;
