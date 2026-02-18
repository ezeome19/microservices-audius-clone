const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware, validateMiddleware } = require('../../../../shared');
const { validate } = require('../models/song');
const checkSongAccess = require('../middleware/checkSongAccess');
const { uploadSongWithCover, handleUploadError } = require('../middleware/uploadMiddleware');
const {
    getAllSongs,
    getSongById,
    getPersonalizedFeed
} = require('../controllers/songController');

const checkPlaybackLimit = require('../middleware/checkPlaybackLimit');

// Get personalized feed (based on user's preferred artists)
router.get('/feed', authMiddleware, getPersonalizedFeed);

// Get all songs
router.get('/', getAllSongs);

// Get song by ID (Protected by playback limits)
router.get('/:id', [authMiddleware, checkPlaybackLimit], getSongById);

module.exports = router;

