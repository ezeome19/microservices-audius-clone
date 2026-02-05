const {
    findAllPublicPlaylists,
    findUserPlaylists,
    findPlaylistById,
    createNewPlaylist,
    updatePlaylistData,
    deletePlaylistById
} = require('../services/playlistServices');


// Get all public playlists
async function getAllPlaylists(req, res) {
    const playlists = await findAllPublicPlaylists();
    res.json({
        message: 'Public playlists retrieved successfully',
        playlists
    });
}

// Get user's playlists
async function getUserPlaylists(req, res) {
    const playlists = await findUserPlaylists(req.user.id);
    res.json({
        message: 'User playlists retrieved successfully',
        playlists
    });
}

// Get playlist by ID
async function getPlaylistById(req, res) {
    const playlist = await findPlaylistById(req.params.id);

    if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check visibility
    if (!playlist.isPublic && (!req.user || req.user.id !== playlist.userId)) {
        return res.status(403).json({ message: 'This playlist is private' });
    }

    res.json({
        message: 'Playlist retrieved successfully',
        playlist
    });
}

const axios = require('axios');

// Create new playlist
async function createPlaylist(req, res) {
    try {
        const userId = req.user.id;

        // 1. Check User Tier
        const paymentUrl = `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003'}/api/payment/wallet`;
        const paymentRes = await axios.get(paymentUrl, {
            headers: { Authorization: req.headers.authorization }
        });
        const userTier = paymentRes.data.tier || 'free';

        // 2. Enforce Tier Rules
        if (userTier === 'free' || userTier === 'daily') {
            return res.status(403).json({
                message: `Your current tier (${userTier}) does not allow playlist creation. Upgrade to Weekly or Monthly!`,
                code: 'PLAYLIST_CREATION_BLOCKED'
            });
        }

        const playlist = await createNewPlaylist(req.body, userId);
        res.json({
            message: 'Playlist created successfully',
            playlist
        });
    } catch (error) {
        console.error('Playlist creation check failed:', error.message);
        // Fallback or handle error
        res.status(500).json({ message: 'Failed to verify subscription for playlist creation' });
    }
}

// Update playlist
async function updatePlaylist(req, res) {
    // req.playlist is attached by checkPlaylistOwner middleware
    const updatedPlaylist = await updatePlaylistData(req.playlist, req.body);
    res.json({
        message: 'Playlist updated successfully',
        playlist: updatedPlaylist
    });
}

// Delete playlist
async function deletePlaylist(req, res) {
    // req.playlist is attached by checkPlaylistOwner middleware
    const deletedPlaylist = await deletePlaylistById(req.playlist);
    res.json({
        message: 'Playlist deleted successfully',
        playlist: deletedPlaylist
    });
}

module.exports = {
    getAllPlaylists,
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist
};
