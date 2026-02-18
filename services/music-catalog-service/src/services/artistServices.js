const { Artist } = require('../models');
const { searchArtists: audiusSearchArtists, getArtist, mapAudiusArtistToLocal } = require('./audiusService');

// Find all artists with albums and songs information
async function findAllArtists() {
    return await Artist.findAll({
        include: ['albums', 'songs']
    });
}

// Find artist by ID with albums and songs information
async function findArtistById(artistId) {
    const { validate: validateUUID } = require('uuid');
    if (!validateUUID(artistId)) {
        return null;
    }
    return await Artist.findByPk(artistId, {
        include: ['albums', 'songs']
    });
}

// Search for artists (local or from Audius)
async function searchArtists(query, source = 'local', limit = 10) {
    if (source === 'audius') {
        // Search Audius API directly
        const audiusArtists = await audiusSearchArtists(query, limit);
        return audiusArtists.map(mapAudiusArtistToLocal);
    }

    // Search local database
    const { Op } = require('sequelize');
    return await Artist.findAll({
        where: {
            name: {
                [Op.like]: `%${query}%`
            }
        },
        limit,
        include: ['albums', 'songs']
    });
}

// Import artist from Audius to local database (cache)
async function importArtistFromAudius(audiusId) {
    // Check if artist already exists locally
    const existingArtist = await Artist.findOne({
        where: { audiusId }
    });

    if (existingArtist) {
        return existingArtist;
    }

    // Fetch from Audius
    const audiusArtist = await getArtist(audiusId);
    const mappedData = mapAudiusArtistToLocal(audiusArtist);

    // Create in local database
    return await Artist.create(mappedData);
}

// Create new artist
async function createNewArtist(artistData) {
    return await Artist.create(artistData);
}

// Update artist data
async function updateArtistData(artist, updateData) {
    await artist.update(updateData);
    return artist;
}

// Delete artist
async function deleteArtistById(artist) {
    await artist.destroy();
    return artist;
}

module.exports = {
    findAllArtists,
    findArtistById,
    searchArtists,
    importArtistFromAudius,
    createNewArtist,
    updateArtistData,
    deleteArtistById
};
