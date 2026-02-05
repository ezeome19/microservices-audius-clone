const {
    audiusService: {
        getArtist,
        getArtistTracks,
        searchArtists,
        mapAudiusArtistToLocal,
        mapAudiusTrack
    }
} = require('@spotify-backend/shared');


// Get all artists (Using search or trending if available, for now just placeholder or remove)
async function getAllArtists(req, res) {
    // Audius doesn't have a "get all", so we might return empty or trending
    res.json({
        message: 'Artists retrieved successfully',
        artists: []
    });
}

// Search artists (Strictly Audius)
async function searchArtistsController(req, res) {
    const { query, limit = 10 } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    const artists = await searchArtists(query, parseInt(limit));
    const mappedArtists = artists.map(mapAudiusArtistToLocal).filter(Boolean);

    res.json({
        message: 'Artists search completed',
        source: 'audius',
        count: mappedArtists.length,
        artists: mappedArtists
    });
}

// Get artist by ID (Strictly Audius)
async function getArtistById(req, res) {
    const artistRaw = await getArtist(req.params.id);

    if (!artistRaw) {
        return res.status(404).json({ message: 'Artist not found' });
    }

    const artist = mapAudiusArtistToLocal(artistRaw);

    res.json({
        message: 'Artist retrieved successfully',
        artist
    });
}

// Get artist tracks
async function getArtistTracksController(req, res) {
    const tracksRaw = await getArtistTracks(req.params.id);
    const tracks = tracksRaw.map(mapAudiusTrack).filter(Boolean);

    res.json({
        message: 'Artist tracks retrieved successfully',
        count: tracks.length,
        tracks
    });
}

// Import artist (save to user preferences)
async function importArtist(req, res) {
    const { audiusId } = req.body;

    if (!audiusId) {
        return res.status(400).json({ message: 'audiusId is required' });
    }

    // Fetch artist details from Audius
    const artistRaw = await getArtist(audiusId);

    if (!artistRaw) {
        return res.status(404).json({ message: 'Artist not found on Audius' });
    }

    const artist = mapAudiusArtistToLocal(artistRaw);

    // Return artist info (preferences will be saved separately by frontend)
    res.json({
        message: 'Artist imported successfully',
        artist: {
            id: artist.id,
            name: artist.name,
            profileImageUrl: artist.profileImageUrl
        }
    });
}

module.exports = {
    getAllArtists,
    searchArtistsController,
    getArtistById,
    getArtistTracksController,
    importArtist
};
