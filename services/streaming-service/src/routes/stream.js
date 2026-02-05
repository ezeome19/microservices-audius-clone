const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const { streamSong } = require('../controllers/streamController');

// Stream audio file with range support
router.get('/:songId', authMiddleware, streamSong);

module.exports = router;

