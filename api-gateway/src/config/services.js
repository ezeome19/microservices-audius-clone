// Service URLs configuration

module.exports = {
    auth: `http://127.0.0.1:${process.env.AUTH_PORT || 3001}`,
    music: `http://127.0.0.1:${process.env.MUSIC_PORT || 3002}`,
    streaming: `http://127.0.0.1:${process.env.STREAMING_PORT || 3003}`,
    social: `http://127.0.0.1:${process.env.SOCIAL_PORT || 3004}`,
    payment: `http://127.0.0.1:${process.env.PAYMENT_PORT || 3005}`,
    recommendations: `http://127.0.0.1:${process.env.RECOMMENDATIONS_PORT || 3006}`,
    analytics: `http://127.0.0.1:${process.env.ANALYTICS_PORT || 3007}`
};
