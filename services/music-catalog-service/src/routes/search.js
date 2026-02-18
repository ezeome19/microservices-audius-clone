const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    searchAll,
    searchSongs,
    searchArtists,
    searchAlbums,
    searchPlaylists
} = require('../controllers/searchController');

// Search all content types
router.get('/', authMiddleware, searchAll);

// Search specific content types
router.get('/songs', authMiddleware, searchSongs);
router.get('/artists', authMiddleware, searchArtists);
router.get('/albums', authMiddleware, searchAlbums);
router.get('/playlists', authMiddleware, searchPlaylists);

module.exports = router;
