const {
    audiusService: {
        getStreamUrl
    }
} = require('../../../../shared');

// Stream audio file (Strict Proxy to Audius)
async function streamSong(req, res) {
    const songId = req.params.songId;

    const streamUrl = await getStreamUrl(songId);

    if (!streamUrl) {
        return res.status(404).json({ message: 'Stream not found on Audius' });
    }

    // Redirect to the actual Audius stream URL
    // The frontend audio player follows redirects automatically
    return res.redirect(streamUrl);
}

module.exports = {
    streamSong
};
