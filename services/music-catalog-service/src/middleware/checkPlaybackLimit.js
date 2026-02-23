const { StreamEntry } = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');

async function checkPlaybackLimit(req, res, next) {
    try {
        const userId = req.user.id;

        // 1. Get User Type/Tier from Payment Service
        // Use the internal service URL if available, otherwise fallback to localhost:3005
        const paymentBaseUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';
        const paymentUrl = `${paymentBaseUrl}/wallet`; // direct service call, routes mounted at root

        const paymentRes = await axios.get(paymentUrl, {
            headers: { 'x-auth-token': req.header('x-auth-token') }
        });

        const userTier = paymentRes.data.tier || 'free'; // Default to free
        const shouldLogPlay = req.query.logPlay === 'true';

        if (shouldLogPlay && userTier === 'free') {
            // 2. Count plays in the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const playCount = await StreamEntry.count({
                where: {
                    userId,
                    playedAt: { [Op.gte]: twentyFourHoursAgo }
                }
            });

            if (playCount >= 25) {
                return res.status(403).json({
                    message: 'Daily stream limit reached',
                    code: 'LIMIT_REACHED',
                    limit: 25
                });
            }
        }

        // 3. Log this play only if requested
        if (shouldLogPlay) {
            await StreamEntry.create({
                userId,
                songId: req.params.id || req.body.songId
            });
        }

        next();
    } catch (error) {
        console.error('Playback limit check failed:', error.message);
        next(); // Fallback to allowing play if service is down, or implement stricter rules
    }
}

module.exports = checkPlaybackLimit;
