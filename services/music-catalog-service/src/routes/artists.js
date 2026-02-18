const express = require('express');
const router = express.Router();
const { authMiddleware, validateMiddleware } = require('../../../../shared');
const { validate } = require('../models/artist');
const checkArtistOwner = require('../middleware/checkArtistOwner');
const {
    getAllArtists,
    searchArtistsController,
    getArtistById,
    getArtistTracksController,
    getArtistAlbumsController,
    getArtistPlaylistsController,
    importArtist
} = require('../controllers/artistController');

// Search artists (local or Audius)
router.get('/search', searchArtistsController);

// Import artist (save to preferences)
router.post('/import', authMiddleware, importArtist);

// Get all artists
router.get('/', getAllArtists);

// Get artist by ID
router.get('/:id', getArtistById);

// Get artist tracks
router.get('/:id/tracks', getArtistTracksController);

// Get artist albums
router.get('/:id/albums', getArtistAlbumsController);

// Get artist playlists
router.get('/:id/playlists', getArtistPlaylistsController);

module.exports = router;

