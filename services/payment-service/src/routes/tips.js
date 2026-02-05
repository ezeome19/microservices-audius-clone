const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../../shared');
const {
    initializeTip,
    verifyTip,
    spendCoins
} = require('../controllers/tipController');

// Verify tip payment
router.post('/verify', authMiddleware, verifyTip);

// Initialize tip to artist
router.post('/:artistId', authMiddleware, initializeTip);

// Spend coins to unlock content
router.post('/spend', authMiddleware, spendCoins);

module.exports = router;
