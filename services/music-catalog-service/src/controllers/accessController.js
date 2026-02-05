const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

// Middleware to check if user has access to exclusive content
async function checkContentAccess(req, res, next) {
    const { songId, albumId } = req.params;
    const userId = req.user.id;
    const { Song, Album, UserContentAccess } = require('../models');

    let content, contentType, contentId;

    // Determine content type
    if (songId) {
        content = await Song.findByPk(songId);
        contentType = 'song';
        contentId = songId;
    } else if (albumId) {
        content = await Album.findByPk(albumId);
        contentType = 'album';
        contentId = albumId;
    } else {
        return res.status(400).json({ message: 'Invalid content ID' });
    }

    if (!content) {
        return res.status(404).json({ message: 'Content not found' });
    }

    // If content is not exclusive, allow access
    if (!content.isExclusive) {
        return next();
    }

    // Check if exclusive period has expired
    if (content.exclusiveUntil && new Date() > new Date(content.exclusiveUntil)) {
        await content.update({ isExclusive: false });
        return next();
    }

    // Check if user has already unlocked this content
    const access = await UserContentAccess.findOne({
        where: { userId, contentId, contentType }
    });

    if (access) {
        // Check if access has expired
        if (access.expiresAt && new Date() > new Date(access.expiresAt)) {
            return res.status(402).json({
                message: 'Access expired',
                requiredCoins: content.requiredCoins,
                artistId: content.artistId
            });
        }
        return next(); // User has access
    }

    // User doesn't have access - return 402 Payment Required
    return res.status(402).json({
        message: 'Exclusive content - purchase required',
        requiredCoins: content.requiredCoins,
        artistId: content.artistId,
        contentType,
        contentId
    });
}

// Unlock exclusive content with coins
async function unlockContent(req, res) {
    const { contentId, contentType } = req.body;
    const userId = req.user.id;
    const { Song, Album, UserContentAccess } = require('../models');

    // Get content
    const Model = contentType === 'song' ? Song : Album;
    const content = await Model.findByPk(contentId);

    if (!content) {
        return res.status(404).json({ message: 'Content not found' });
    }

    if (!content.isExclusive) {
        return res.status(400).json({ message: 'Content is not exclusive' });
    }

    // Check if already unlocked
    const existingAccess = await UserContentAccess.findOne({
        where: { userId, contentId, contentType }
    });

    if (existingAccess) {
        return res.status(400).json({ message: 'Content already unlocked' });
    }

    // Call Payment Service to spend coins
    try {
        const spendResponse = await axios.post(
            `${PAYMENT_SERVICE_URL}/api/tips/spend`,
            {
                artistId: content.artistId,
                contentId,
                contentType,
                coinAmount: content.requiredCoins
            },
            {
                headers: { 'x-auth-token': req.headers['x-auth-token'] }
            }
        );

        // Grant access
        await UserContentAccess.create({
            userId,
            contentId,
            contentType,
            artistId: content.artistId,
            accessType: 'purchased',
            coinsSpent: content.requiredCoins
        });

        res.json({
            message: 'Content unlocked successfully',
            coinsSpent: content.requiredCoins,
            newBalance: spendResponse.data.newBalance
        });
    } catch (paymentError) {
        if (paymentError.response && paymentError.response.status === 402) {
            return res.status(402).json({
                message: 'Insufficient coins',
                required: content.requiredCoins,
                current: paymentError.response.data.current
            });
        }
        throw paymentError;
    }
}

// Check if user has access to content
async function checkUserAccess(req, res) {
    const { contentId, contentType } = req.query;
    const userId = req.user.id;
    const { UserContentAccess } = require('../models');

    const access = await UserContentAccess.findOne({
        where: { userId, contentId, contentType }
    });

    res.json({
        hasAccess: !!access,
        access: access || null
    });
}

module.exports = {
    checkContentAccess,
    unlockContent,
    checkUserAccess
};
