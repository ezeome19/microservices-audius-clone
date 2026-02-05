// Subscription tiers for Audius platform
const SUBSCRIPTION_TIERS = {
    // Legacy/Artist Coin Packs
    starter: {
        name: 'Starter Pack',
        priceNGN: 5000,
        priceUSD: 6,
        coinsPerArtist: 100,
        maxArtists: 3,
        bonusCoins: 50,
        description: '3 favorited artists + bonus coins'
    },
    fan: {
        name: 'Fan Pack',
        priceNGN: 15000,
        priceUSD: 18,
        coinsPerArtist: 200,
        maxArtists: 10,
        bonusCoins: 200,
        description: '10 artists + extra bonus'
    },
    superfan: {
        name: 'Superfan Pack',
        priceNGN: 30000,
        priceUSD: 36,
        coinsPerArtist: 300,
        maxArtists: 999,
        bonusCoins: 500,
        description: 'Unlimited artists + premium features'
    },

    // New Streaming Tiers
    daily: {
        name: 'Daily Access',
        priceNGN: 500,
        priceUSD: 0.35,
        durationDays: 1,
        aTokens: 5,
        streams: 125,
        description: '24h Access + 125 Streams',
        privileges: ['ad_free', 'high_quality']
    },
    weekly: {
        name: 'Weekly Access',
        priceNGN: 2000,
        priceUSD: 1.35,
        durationDays: 7,
        aTokens: 25,
        streams: 625,
        description: '7 Days + 625 Streams + Uploads',
        privileges: ['ad_free', 'high_quality', 'playlists', 'uploads', 'offline', 'priority_support']
    },
    monthly: {
        name: 'Monthly Access',
        priceNGN: 7500,
        priceUSD: 5.00,
        durationDays: 30,
        aTokens: 100,
        streams: 2500,
        description: '30 Days + 2,500 Streams + Full Access',
        privileges: ['ad_free', 'high_quality', 'unlimited_playlists', 'uploads', 'offline', 'priority_support', 'early_access', 'analytics']
    },
    yearly: {
        name: 'Yearly Access',
        priceNGN: 75000,
        priceUSD: 50.00,
        durationDays: 365,
        aTokens: 1500,
        streams: 37500,
        description: '365 Days + 37,500 Streams + Premium Badge',
        privileges: ['ad_free', 'high_quality', 'unlimited_playlists', 'uploads', 'offline', 'vip_support', 'early_access', 'analytics', 'crown_badge', 'exclusive_content', 'custom_themes']
    }
};

module.exports = {
    SUBSCRIPTION_TIERS
};
