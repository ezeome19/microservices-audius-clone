const express = require('express');
const router = express.Router();
const { authMiddleware, validateMiddleware } = require('../../../../shared');
const { validate, validateUpdate, validateAddTrack } = require('../models/userPlaylist');
const {
    create,
    getMyPlaylists,
    getPublic,
    getById,
    update,
    remove,
    addTrack,
    removeTrack
} = require('../controllers/userPlaylistController');

// Public routes
router.get('/public', getPublic);
router.get('/:id', getById);

// Protected routes (require authentication)
router.post('/', [authMiddleware, validateMiddleware(validate)], create);
router.get('/', authMiddleware, getMyPlaylists);
router.put('/:id', [authMiddleware, validateMiddleware(validateUpdate)], update);
router.delete('/:id', authMiddleware, remove);

// Track management
router.post('/:id/tracks', [authMiddleware, validateMiddleware(validateAddTrack)], addTrack);
router.delete('/:id/tracks/:trackId', authMiddleware, removeTrack);

module.exports = router;
