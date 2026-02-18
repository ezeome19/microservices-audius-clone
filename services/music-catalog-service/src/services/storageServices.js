const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

/**
 * Storage Services - Cloud storage integration for audio files and images
 * Supports AWS S3 (can be adapted for Cloudflare R2 or other S3-compatible services)
 */

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'audius-clone-music';

/**
 * Generate unique filename with timestamp and random hash
 * @param {string} originalName - Original filename
 * @param {string} prefix - Folder prefix (e.g., 'audio', 'covers')
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');

    return prefix
        ? `${prefix}/${timestamp}-${randomHash}-${sanitizedName}${ext}`
        : `${timestamp}-${randomHash}-${sanitizedName}${ext}`;
}

/**
 * Upload audio file to S3
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} metadata - File metadata (originalName, mimetype, artistId, songId)
 * @returns {Promise<string>} S3 file URL
 */
async function uploadAudioFile(fileBuffer, metadata) {
    const { originalName, mimetype, artistId, songId } = metadata;
    const fileName = generateUniqueFilename(originalName, `audio/${artistId}`);

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            artistId: artistId,
            songId: songId || 'pending',
            uploadedAt: new Date().toISOString()
        }
    };

    try {
        await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        return fileUrl;
    } catch (error) {
        console.error('Error uploading audio file to S3:', error);
        throw new Error('Failed to upload audio file to cloud storage');
    }
}

/**
 * Upload cover art to S3
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} metadata - File metadata (originalName, mimetype, artistId, songId)
 * @returns {Promise<string>} S3 file URL
 */
async function uploadCoverArt(fileBuffer, metadata) {
    const { originalName, mimetype, artistId, songId } = metadata;
    const fileName = generateUniqueFilename(originalName, `covers/${artistId}`);

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            artistId: artistId,
            songId: songId || 'pending',
            uploadedAt: new Date().toISOString()
        }
    };

    try {
        await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        return fileUrl;
    } catch (error) {
        console.error('Error uploading cover art to S3:', error);
        throw new Error('Failed to upload cover art to cloud storage');
    }
}

/**
 * Delete file from S3
 * @param {string} fileUrl - Full S3 URL of the file
 * @returns {Promise<void>}
 */
async function deleteFile(fileUrl) {
    try {
        // Extract key from URL
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete file from cloud storage');
    }
}

/**
 * Upload profile image for artist
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} metadata - File metadata (originalName, mimetype, artistId)
 * @returns {Promise<string>} S3 file URL
 */
async function uploadProfileImage(fileBuffer, metadata) {
    const { originalName, mimetype, artistId } = metadata;
    const fileName = generateUniqueFilename(originalName, `profiles/${artistId}`);

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
        Metadata: {
            artistId: artistId,
            type: 'profile-image',
            uploadedAt: new Date().toISOString()
        }
    };

    try {
        await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        return fileUrl;
    } catch (error) {
        console.error('Error uploading profile image to S3:', error);
        throw new Error('Failed to upload profile image to cloud storage');
    }
}

module.exports = {
    uploadAudioFile,
    uploadCoverArt,
    deleteFile,
    uploadProfileImage
};
