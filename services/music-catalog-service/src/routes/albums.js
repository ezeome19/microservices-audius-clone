const express = require('express');
const router = express.Router();
const { authMiddleware, validateMiddleware } = require('../../../../shared');
const { validate } = require('../models/album');
const checkAlbumOwner = require('../middleware/checkAlbumOwner');
const {
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum
} = require('../controllers/albumController');

// Get all albums
router.get('/', getAllAlbums);

// Get album by ID
router.get('/:id', getAlbumById);

// Create album (protected)
router.post('/', [authMiddleware, validateMiddleware(validate)], createAlbum);

// Update album (protected, admin only)
router.put('/:id', [authMiddleware, validateMiddleware(validate), checkAlbumOwner], updateAlbum);

// Delete album (protected, admin only)
router.delete('/:id', [authMiddleware, checkAlbumOwner], deleteAlbum);

module.exports = router;

