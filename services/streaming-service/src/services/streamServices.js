const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createRedisClient, CacheManager } = require('../../../../shared');
// Fix import path - creating local instance for now if shared fails or relative path issues
// In production, use singleton from app.js
const redisConfig = { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 };
const redisClient = require('ioredis').createClient ? require('ioredis').createClient(redisConfig) : new (require('ioredis'))(redisConfig);
const cache = new CacheManager(redisClient);

const MUSIC_DIR = process.env.MUSIC_FILES_PATH || path.join(__dirname, '../../music-files');

// Ensure music dir exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// Get Redis key for song plays
const getPlaysKey = (songId) => `song:${songId}:plays`;

async function handleStreamRequest(req, res, songId, audiusUrl) {
    const localFilePath = path.join(MUSIC_DIR, `${songId}.mp3`);

    // 1. Check if file exists locally (Cache Hit)
    if (fs.existsSync(localFilePath)) {
        console.log(`[Stream] Serving from local cache: ${songId}`);
        const stat = fs.statSync(localFilePath);
        streamLocalFile(req, res, localFilePath, stat.size);
        return;
    }

    // 2. Not in cache - Increment play count
    try {
        const plays = await redisClient.incr(getPlaysKey(songId));
        console.log(`[Stream] Song ${songId} plays: ${plays}`);

        // 3. Logic: If plays > 2, trigger background download (Cache Miss -> Cache Fill)
        if (plays > 2) {
            downloadToCache(audiusUrl, localFilePath).catch(err => console.error('Cache download failed', err));
        }
    } catch (err) {
        console.error('Redis error:', err);
    }

    // 4. Stream from remote Audius URL (Proxy)
    console.log(`[Stream] Proxying from Audius: ${songId}`);
    try {
        const response = await axios({
            method: 'get',
            url: audiusUrl,
            responseType: 'stream'
        });

        // Forward headers
        res.setHeader('Content-Type', 'audio/mpeg');
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error.message);
        if (!res.headersSent) res.status(502).send('Error fetching stream');
    }
}

async function downloadToCache(url, destination) {
    console.log(`[Cache] Downloading ${url} to ${destination}`);
    const writer = fs.createWriteStream(destination);

    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Standard local streaming with Range support
function streamLocalFile(req, res, filePath, fileSize) {
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
}

module.exports = {
    handleStreamRequest
};
