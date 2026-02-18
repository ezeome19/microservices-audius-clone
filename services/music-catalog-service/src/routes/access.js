const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    unlockContent,
    checkUserAccess
} = require('../controllers/accessController');

// Unlock exclusive content
router.post('/unlock', authMiddleware, unlockContent);

// Check if user has access to content
router.get('/check', authMiddleware, checkUserAccess);

module.exports = router;
