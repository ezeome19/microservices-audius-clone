const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    trackListening,
    getHistory,
    getRecent,
    getTop
} = require('../controllers/historyController');

// Track listening event
router.post('/', authMiddleware, trackListening);

// Get user's listening history
router.get('/', authMiddleware, getHistory);

// Get recently played songs
router.get('/recent', authMiddleware, getRecent);

// Get most played songs
router.get('/top', authMiddleware, getTop);

module.exports = router;

