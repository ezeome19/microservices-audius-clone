const { sdk } = require('@audius/sdk');
const axios = require('axios');

let audiusSdk = null;
let host = null;
let cache = null;

const init = () => {
    // Keep SDK for future write operations
    if (audiusSdk) return audiusSdk;

    const apiKey = process.env.AUDIUS_API_KEY;
    const apiSecret = process.env.AUDIUS_API_SECRET;

    if (apiKey && apiSecret) {
        try {
            audiusSdk = sdk({ apiKey, apiSecret, appName: 'Audius Clone Demo' });
            console.log('[AudiusService] SDK Initialized (for writes).');
        } catch (error) {
            console.error('[AudiusService] SDK Init Failed:', error);
        }
    }
    return audiusSdk;
};

/**
 * Configure a CacheManager for the service
 * @param {object} cacheManager - The CacheManager instance from shared utils
 */
function setCacheManager(cacheManager) {
    cache = cacheManager;
    console.log('[AudiusService] CacheManager configured.');
}

// Helper to get Audius Host
async function getHost() {
    if (host) return host;
    try {
        const response = await axios.get('https://api.audius.co');
        host = response.data.data[0];
        return host;
    } catch (error) {
        console.error('[AudiusService] Failed to get host:', error.message);
        return 'https://discoveryprovider.audius.co'; // Fallback
    }
}

// --- API Methods (REST) ---

async function searchTracks(query, limit = 10) {
    const cacheKey = `audius:search:tracks:${query}:${limit}`;
    if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/tracks/search`;
        const { data } = await axios.get(url, {
            params: { query, limit, app_name: 'AudiusCloneDemo' }
        });
        const tracks = data.data || [];

        if (cache && tracks.length > 0) {
            await cache.set(cacheKey, tracks, 300); // Cache for 5 mins
        }
        return tracks;
    } catch (error) {
        console.error('[AudiusService] searchTracks error:', error.message);
        return [];
    }
}

async function searchArtists(query, limit = 10) {
    const cacheKey = `audius:search:artists:${query}:${limit}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (artists):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/users/search`;
        const { data } = await axios.get(url, {
            params: { query, limit, app_name: 'AudiusCloneDemo' }
        });
        const artists = data.data || [];

        if (cache && artists.length > 0) {
            try {
                await cache.set(cacheKey, artists, 300); // Cache for 5 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (artists):', err.message);
            }
        }
        return artists;
    } catch (error) {
        console.error('[AudiusService] searchArtists error:', error.message);
        return [];
    }
}

async function searchPlaylists(query, limit = 10) {
    const cacheKey = `audius:search:playlists:${query}:${limit}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (playlists):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/playlists/search`;
        const { data } = await axios.get(url, {
            params: { query, limit, app_name: 'AudiusCloneDemo' }
        });
        const playlists = data.data || [];

        if (cache && playlists.length > 0) {
            try {
                await cache.set(cacheKey, playlists, 300); // Cache for 5 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (playlists):', err.message);
            }
        }
        return playlists;
    } catch (error) {
        console.error('[AudiusService] searchPlaylists error:', error.message);
        return [];
    }
}

async function getTrendingTracks(limit = 20, time = 'allTime', genre = null) {
    const cacheKey = `audius:trending:${time}:${genre || 'all'}:${limit}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (trending):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/tracks/trending`;
        const params = { limit, app_name: 'AudiusCloneDemo', time };
        if (genre) params.genre = genre;

        const { data } = await axios.get(url, { params });
        const tracks = data.data || [];

        if (cache && tracks.length > 0) {
            try {
                await cache.set(cacheKey, tracks, 600); // Cache for 10 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (trending):', err.message);
            }
        }
        return tracks;
    } catch (error) {
        console.error('[AudiusService] getTrendingTracks error:', error.message);
        return [];
    }
}

async function getTrack(trackId) {
    if (!trackId || typeof trackId !== 'string') return null;

    // Skip Audius fetch for local UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trackId)) {
        return null;
    }

    const cacheKey = `audius:track:${trackId}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (track):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/tracks/${trackId}`;
        const { data } = await axios.get(url, {
            params: { app_name: 'AudiusCloneDemo' }
        });
        const track = data.data;

        if (cache && track) {
            try {
                await cache.set(cacheKey, track, 3600); // Cache for 1 hour
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (track):', err.message);
            }
        }
        return track;
    } catch (error) {
        // Suppress 400/404 errors as they are expected for some locally referenced tracks
        if (error.response && (error.response.status === 400 || error.response.status === 404)) {
            return null;
        }
        console.error('[AudiusService] getTrack error:', error.message);
        return null;
    }
}

async function getRecommendedTracks(trackId, limit = 5) {
    const cacheKey = `audius:track:${trackId}:recommended:${limit}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (recommended):', err.message);
        }
    }

    try {
        const h = await getHost();
        // under_the_radar is a good "recommended" endpoint for a track
        const url = `${h}/v1/tracks/${trackId}/under_the_radar`;
        const { data } = await axios.get(url, {
            params: { limit, app_name: 'AudiusCloneDemo' }
        });
        const tracks = data.data || [];

        if (cache && tracks.length > 0) {
            try {
                await cache.set(cacheKey, tracks, 3600); // Cache for 1 hour
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (recommended):', err.message);
            }
        }
        return tracks;
    } catch (error) {
        console.error('[AudiusService] getRecommendedTracks error:', error.message);
        return [];
    }
}

async function getArtist(userId) {
    const cacheKey = `audius:artist:${userId}`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (artist):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/users/${userId}`;
        const { data } = await axios.get(url, {
            params: { app_name: 'AudiusCloneDemo' }
        });
        const artist = data.data;

        if (cache && artist) {
            try {
                await cache.set(cacheKey, artist, 3600); // Cache for 1 hour
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (artist):', err.message);
            }
        }
        return artist;
    } catch (error) {
        console.error('[AudiusService] getArtist error:', error.message);
        return null;
    }
}

async function getArtistTracks(userId) {
    const cacheKey = `audius:artist:${userId}:tracks`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (artist tracks):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/users/${userId}/tracks`;
        const { data } = await axios.get(url, {
            params: { app_name: 'AudiusCloneDemo' }
        });
        const tracks = data.data || [];

        if (cache && tracks.length > 0) {
            try {
                await cache.set(cacheKey, tracks, 1800); // Cache for 30 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (artist tracks):', err.message);
            }
        }
        return tracks;
    } catch (error) {
        console.error('[AudiusService] getArtistTracks error:', error.message);
        return [];
    }
}

async function getArtistAlbums(userId) {
    const cacheKey = `audius:artist:${userId}:albums`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (artist albums):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/users/${userId}/albums`;
        const { data } = await axios.get(url, {
            params: { app_name: 'AudiusCloneDemo' }
        });
        const albums = data.data || [];

        if (cache && albums.length > 0) {
            try {
                await cache.set(cacheKey, albums, 1800); // Cache for 30 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (artist albums):', err.message);
            }
        }
        return albums;
    } catch (error) {
        console.error('[AudiusService] getArtistAlbums error:', error.message);
        return [];
    }
}

async function getArtistPlaylists(userId) {
    const cacheKey = `audius:artist:${userId}:playlists`;
    if (cache) {
        try {
            const cached = await cache.get(cacheKey);
            if (cached) return cached;
        } catch (err) {
            console.warn('[AudiusService] Cache GET failed (artist playlists):', err.message);
        }
    }

    try {
        const h = await getHost();
        const url = `${h}/v1/users/${userId}/playlists`;
        const { data } = await axios.get(url, {
            params: { app_name: 'AudiusCloneDemo' }
        });
        const playlists = data.data || [];

        if (cache && playlists.length > 0) {
            try {
                await cache.set(cacheKey, playlists, 1800); // Cache for 30 mins
            } catch (err) {
                console.warn('[AudiusService] Cache SET failed (artist playlists):', err.message);
            }
        }
        return playlists;
    } catch (error) {
        console.error('[AudiusService] getArtistPlaylists error:', error.message);
        return [];
    }
}

async function getStreamUrl(trackId) {
    // We don't cache the stream URL itself because it might have expiring tokens or point to dynamic hosts
    try {
        const h = await getHost();
        return `${h}/v1/tracks/${trackId}/stream?app_name=AudiusCloneDemo`;
    } catch (error) {
        console.error('[AudiusService] getStreamUrl error:', error.message);
        return null;
    }
}

// --- Mappers ---

// Helper to determine why a track is gated
function getGatedReason(streamConditions) {
    if (!streamConditions) return 'Unknown gating condition';

    // Check for different gating types
    if (streamConditions.nft_collection) {
        return 'NFT Collection Required';
    }
    if (streamConditions.follow_user_id) {
        return 'Follow Required';
    }
    if (streamConditions.tip_user_id) {
        return 'Tip Required';
    }
    if (streamConditions.usdc_purchase) {
        return 'USDC Purchase Required';
    }

    return 'Access Restricted';
}


function mapAudiusTrack(track) {
    if (!track) return null;
    try {
        // Check if track is gated (requires authentication/payment/NFT/follow)
        const isGated = track.is_stream_gated || false;
        const streamConditions = track.stream_conditions || null;

        return {
            id: track.id,
            title: track.title,
            duration: track.duration,
            genre: track.genre,
            description: track.description,
            releaseDate: track.release_date,
            playCount: track.play_count,
            repostCount: track.repost_count,
            favoriteCount: track.favorite_count,
            coverArtUrl: track.artwork ? track.artwork['480x480'] || track.artwork['150x150'] : null,
            // Point to our internal proxy which now lives in streaming-service or gateway.
            audioUrl: isGated ? null : `/api/stream/music/${track.id}`, // No URL if gated
            artistId: track.user ? track.user.id : 'unknown',
            artist: track.user ? mapAudiusUser(track.user) : { name: 'Unknown Artist' },
            isAudius: true,
            // Gated track information
            isGated: isGated,
            streamConditions: streamConditions,
            gatedReason: isGated ? getGatedReason(streamConditions) : null
        };
    } catch (e) {
        console.error('Error mapping track:', e);
        return null;
    }
}

function mapAudiusUser(user) {
    if (!user) return null;
    try {
        return {
            id: user.id,
            name: user.name,
            handle: user.handle,
            bio: user.bio,
            location: user.location,
            verified: user.is_verified,
            tier: user.tier,
            followerCount: user.follower_count,
            followingCount: user.followee_count,
            trackCount: user.track_count,
            coverPhotoUrl: user.cover_photo ? user.cover_photo['640x'] : null,
            profilePictureUrl: user.profile_picture ? user.profile_picture['150x150'] : null,
            isAudius: true
        };
    } catch (e) {
        console.error('Error mapping user:', e);
        return null;
    }
}

function mapAudiusPlaylist(playlist) {
    if (!playlist) return null;
    return {
        id: playlist.id,
        name: playlist.playlist_name,
        description: playlist.description,
        coverArtUrl: playlist.artwork ? playlist.artwork['480x480'] : null,
        ownerId: playlist.user.id,
        owner: mapAudiusUser(playlist.user),
        isAudius: true
    };
}

module.exports = {
    init,
    setCacheManager,
    searchTracks,
    searchArtists,
    searchPlaylists,
    getTrendingTracks,
    getTrack,
    getArtist,
    getArtistTracks,
    getArtistAlbums,
    getArtistPlaylists,
    getStreamUrl,
    mapAudiusArtistToLocal: mapAudiusUser,
    mapAudiusTrack,
    mapAudiusPlaylist
};
