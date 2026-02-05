const { UserPlaylist } = require('../models');
// Note: getTrack function not yet implemented in audiusService
// const { getTrack } = require('./audiusService');

/**
 * User Playlist Services - Business logic for user-created playlists
 */

// Create new playlist
async function createPlaylist(userId, playlistData) {
    const playlist = await UserPlaylist.create({
        userId,
        ...playlistData,
        tracks: []
    });
    return playlist;
}

// Get user's playlists
async function getUserPlaylists(userId, includePrivate = true) {
    const where = { userId };

    if (!includePrivate) {
        where.isPublic = true;
    }

    return await UserPlaylist.findAll({
        where,
        order: [['createdAt', 'DESC']]
    });
}

// Get public playlists
async function getPublicPlaylists(limit = 20) {
    return await UserPlaylist.findAll({
        where: { isPublic: true },
        limit,
        order: [['createdAt', 'DESC']]
    });
}

// Get playlist by ID
async function getPlaylistById(playlistId, userId = null) {
    const playlist = await UserPlaylist.findByPk(playlistId);

    if (!playlist) {
        return null;
    }

    // Check if user has access to private playlist
    if (!playlist.isPublic && playlist.userId !== userId) {
        throw new Error('You do not have access to this playlist');
    }

    return playlist;
}

// Update playlist
async function updatePlaylist(playlistId, userId, updateData) {
    const playlist = await UserPlaylist.findByPk(playlistId);

    if (!playlist) {
        throw new Error('Playlist not found');
    }

    if (playlist.userId !== userId) {
        throw new Error('You can only update your own playlists');
    }

    await playlist.update(updateData);
    return playlist;
}

// Delete playlist
async function deletePlaylist(playlistId, userId) {
    const playlist = await UserPlaylist.findByPk(playlistId);

    if (!playlist) {
        throw new Error('Playlist not found');
    }

    if (playlist.userId !== userId) {
        throw new Error('You can only delete your own playlists');
    }

    await playlist.destroy();
    return playlist;
}

// Add track to playlist
async function addTrackToPlaylist(playlistId, userId, audiusTrackId) {
    const playlist = await UserPlaylist.findByPk(playlistId);

    if (!playlist) {
        throw new Error('Playlist not found');
    }

    if (playlist.userId !== userId) {
        throw new Error('You can only add tracks to your own playlists');
    }

    // Check if track already exists in playlist
    const tracks = playlist.tracks || [];
    const trackExists = tracks.some(t => t.audiusTrackId === audiusTrackId);

    if (trackExists) {
        throw new Error('Track already exists in playlist');
    }

    // Verify track exists on Audius (optional validation)
    // TODO: Implement getTrack in audiusService.js
    /*
    try {
        await getTrack(audiusTrackId);
    } catch (error) {
        throw new Error('Invalid Audius track ID');
    }
    */

    // Add track
    const newTrack = {
        audiusTrackId,
        addedAt: new Date().toISOString(),
        addedBy: userId
    };

    tracks.push(newTrack);
    await playlist.update({ tracks });

    return playlist;
}

// Remove track from playlist
async function removeTrackFromPlaylist(playlistId, userId, audiusTrackId) {
    const playlist = await UserPlaylist.findByPk(playlistId);

    if (!playlist) {
        throw new Error('Playlist not found');
    }

    if (playlist.userId !== userId) {
        throw new Error('You can only remove tracks from your own playlists');
    }

    const tracks = playlist.tracks || [];
    const updatedTracks = tracks.filter(t => t.audiusTrackId !== audiusTrackId);

    if (tracks.length === updatedTracks.length) {
        throw new Error('Track not found in playlist');
    }

    await playlist.update({ tracks: updatedTracks });

    return playlist;
}

// Get playlist with full track details from Audius
async function getPlaylistWithTracks(playlistId, userId = null) {
    const playlist = await getPlaylistById(playlistId, userId);

    if (!playlist) {
        return null;
    }

    // Fetch full track details from Audius API
    // TODO: Implement getTrack in audiusService.js
    const tracks = playlist.tracks || [];
    /*
    const trackDetailsPromises = tracks.map(async (track) => {
        try {
            const audiusTrack = await getTrack(track.audiusTrackId);
            return {
                ...track,
                trackDetails: audiusTrack
            };
        } catch (error) {
            return {
                ...track,
                trackDetails: null,
                error: 'Track not found on Audius'
            };
        }
    });

    const tracksWithDetails = await Promise.all(trackDetailsPromises);
    */

    // For now, return tracks without full details
    const tracksWithDetails = tracks;

    return {
        ...playlist.toJSON(),
        tracks: tracksWithDetails
    };
}

module.exports = {
    createPlaylist,
    getUserPlaylists,
    getPublicPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getPlaylistWithTracks
};
