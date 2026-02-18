const {
    audiusService: {
        searchTracks,
        searchArtists,
        searchPlaylists,
        mapAudiusTrack,
        mapAudiusArtistToLocal,
        mapAudiusPlaylist
    },
    logger
} = require('../../../../shared');

// General Search (Songs, Artists, Albums, Playlists) - Pure Audius
async function searchAll(req, res) {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const [
        audiusTracksRaw,
        audiusArtistsRaw,
        audiusPlaylistsRaw
    ] = await Promise.all([
        searchTracks(q, 10),
        searchArtists(q, 10),
        searchPlaylists(q, 10)
    ]);

    const songs = audiusTracksRaw.map(mapAudiusTrack).filter(Boolean);
    const artists = audiusArtistsRaw.map(mapAudiusArtistToLocal).filter(Boolean);
    const playlists = audiusPlaylistsRaw.map(mapAudiusPlaylist).filter(Boolean);

    // Albums -> Audius doesn't strictly have an "Album Search" endpoint exposed easily in our service yet, 
    // but often playlists can be albums. For now, empty or map from playlists if is_album type exists.
    const albums = [];

    res.json({
        message: 'Search completed successfully',
        songs,
        albums,
        artists,
        playlists,
        query: q
    });
}

// Search Songs
async function searchSongs(req, res) {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    const tracksRaw = await searchTracks(q, 50);
    const songs = tracksRaw.map(mapAudiusTrack).filter(Boolean);
    res.json({ message: 'Songs search completed', count: songs.length, songs });
}

// Search Artists
async function searchArtistsEndpoint(req, res) {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    const artistsRaw = await searchArtists(q, 50);
    const artists = artistsRaw.map(mapAudiusArtistToLocal).filter(Boolean);
    res.json({ message: 'Artists search completed', count: artists.length, artists });
}

// Search Playlists
async function searchPlaylistsEndpoint(req, res) {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    const playlistsRaw = await searchPlaylists(q, 50);
    const playlists = playlistsRaw.map(mapAudiusPlaylist).filter(Boolean);
    res.json({ message: 'Playlists search completed', count: playlists.length, playlists });
}

// Search Albums - Placeholder
async function searchAlbums(req, res) {
    res.json({ message: 'Albums search completed', count: 0, albums: [] });
}

module.exports = {
    searchAll,
    searchSongs,
    searchArtists: searchArtistsEndpoint,
    searchAlbums,
    searchPlaylists: searchPlaylistsEndpoint
};
