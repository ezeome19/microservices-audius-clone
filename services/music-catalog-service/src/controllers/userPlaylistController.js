const {
    createPlaylist,
    getUserPlaylists,
    getPublicPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getPlaylistWithTracks
} = require('../services/userPlaylistServices');
const axios = require('axios');

// Create playlist
async function create(req, res) {
    try {
        const userId = req.user.id;

        // 1. Check User Tier from Payment Service
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

        const playlist = await createPlaylist(userId, req.body);
        res.status(201).json({
            message: 'Playlist created successfully',
            playlist
        });
    } catch (error) {
        console.error('Playlist creation tier check failed:', error.message);
        res.status(500).json({ message: 'Failed to verify subscription for playlist creation' });
    }
}

// Get user's playlists
async function getMyPlaylists(req, res) {
    const playlists = await getUserPlaylists(req.user.id, true);
    res.json({
        message: 'Playlists retrieved successfully',
        count: playlists.length,
        playlists
    });
}

// Get public playlists
async function getPublic(req, res) {
    const { limit = 20 } = req.query;
    const playlists = await getPublicPlaylists(parseInt(limit));
    res.json({
        message: 'Public playlists retrieved successfully',
        count: playlists.length,
        playlists
    });
}

// Get playlist by ID (with full track details)
async function getById(req, res) {
    const playlist = await getPlaylistWithTracks(req.params.id, req.user?.id);

    if (!playlist) {
        return res.status(404).json({
            message: 'Playlist not found'
        });
    }

    res.json({
        message: 'Playlist retrieved successfully',
        playlist
    });
}

// Update playlist
async function update(req, res) {
    const playlist = await updatePlaylist(req.params.id, req.user.id, req.body);
    res.json({
        message: 'Playlist updated successfully',
        playlist
    });
}

// Delete playlist
async function remove(req, res) {
    const playlist = await deletePlaylist(req.params.id, req.user.id);
    res.json({
        message: 'Playlist deleted successfully',
        playlist
    });
}

// Add track to playlist
async function addTrack(req, res) {
    const { audiusTrackId } = req.body;
    const playlist = await getPlaylistWithTracks(req.params.id, req.user.id);

    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const updatedPlaylist = await addTrackToPlaylist(req.params.id, req.user.id, audiusTrackId);
    res.json({
        message: 'Track added to playlist successfully',
        playlist: updatedPlaylist
    });
}

// Remove track from playlist
async function removeTrack(req, res) {
    const playlist = await removeTrackFromPlaylist(
        req.params.id,
        req.user.id,
        req.params.trackId
    );
    res.json({
        message: 'Track removed from playlist successfully',
        playlist
    });
}

module.exports = {
    create,
    getMyPlaylists,
    getPublic,
    getById,
    update,
    remove,
    addTrack,
    removeTrack
};
