const { uploadAudioFile, uploadCoverArt } = require('./storageServices');
const { Artist } = require('../models');

/**
 * Upload Services - Handle complete song upload workflow
 */

/**
 * Upload song with audio file and optional cover art
 * @param {Object} files - Files from multer (audioFile, coverArt)
 * @param {Object} songData - Song metadata
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<Object>} Upload result with URLs
 */
async function uploadSongFiles(files, songData, userId) {
    try {
        // Find artist by userId
        const artist = await Artist.findOne({ where: { userId } });

        if (!artist) {
            throw new Error('Artist profile not found. Please create an artist profile first.');
        }

        if (!artist.isVerified) {
            throw new Error('Only verified artists can upload music. Please contact support for verification.');
        }

        // Upload audio file
        if (!files.audioFile || files.audioFile.length === 0) {
            throw new Error('Audio file is required');
        }

        const audioFile = files.audioFile[0];
        const audioUrl = await uploadAudioFile(audioFile.buffer, {
            originalName: audioFile.originalname,
            mimetype: audioFile.mimetype,
            artistId: artist.id,
            songId: 'pending'
        });

        // Upload cover art if provided
        let coverArtUrl = null;
        if (files.coverArt && files.coverArt.length > 0) {
            const coverFile = files.coverArt[0];
            coverArtUrl = await uploadCoverArt(coverFile.buffer, {
                originalName: coverFile.originalname,
                mimetype: coverFile.mimetype,
                artistId: artist.id,
                songId: 'pending'
            });
        }

        return {
            audioUrl,
            coverArtUrl,
            artistId: artist.id
        };
    } catch (error) {
        console.error('Error uploading song files:', error);
        throw error;
    }
}

/**
 * Verify artist ownership of a song
 * @param {string} songId - Song ID
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<boolean>} True if user owns the song
 */
async function verifyArtistOwnership(songId, userId) {
    const { Song } = require('../models');

    const song = await Song.findByPk(songId, {
        include: [{
            model: Artist,
            as: 'artist',
            where: { userId }
        }]
    });

    return !!song;
}

module.exports = {
    uploadSongFiles,
    verifyArtistOwnership
};
