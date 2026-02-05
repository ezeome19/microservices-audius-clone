const express = require('express');
const router = express.Router();
const { authMiddleware, validateMiddleware } = require('../../../../shared');
const { validate } = require('../models/playlist');
const checkPlaylistOwner = require('../middleware/checkPlaylistOwner');
const {
    getAllPlaylists,
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist
} = require('../controllers/playlistController');

// Get all public playlists
router.get('/', getAllPlaylists);

// Get user's playlists (protected)
router.get('/my-playlists', authMiddleware, getUserPlaylists);

// Get playlist by ID
router.get('/:id', getPlaylistById);

// Create playlist (protected)
router.post('/', [authMiddleware, validateMiddleware(validate)], createPlaylist);

// Update playlist (protected, owner only)
router.put('/:id', [authMiddleware, validateMiddleware(validate), checkPlaylistOwner], updatePlaylist);

// Delete playlist (protected, owner only)
router.delete('/:id', [authMiddleware, checkPlaylistOwner], deletePlaylist);

module.exports = router;

