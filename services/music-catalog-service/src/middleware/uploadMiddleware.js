const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

/**
 * Multer configuration for audio file uploads
 * Handles file type validation and temporary storage
 */

// Allowed audio file types
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// File size limits (50MB for audio, 5MB for images)
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure storage (memory storage for cloud upload)
const storage = multer.memoryStorage();

// File filter for audio files
const audioFileFilter = (req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3, WAV, and FLAC files are allowed.'), false);
    }
};

// File filter for image files
const imageFileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
    }
};

// Audio upload middleware
const uploadAudio = multer({
    storage: storage,
    fileFilter: audioFileFilter,
    limits: {
        fileSize: MAX_AUDIO_SIZE
    }
}).single('audioFile');

// Cover art upload middleware
const uploadCoverArt = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE
    }
}).single('coverArt');

// Combined upload middleware (audio + cover art)
const uploadSongWithCover = multer({
    storage: storage,
    limits: {
        fileSize: MAX_AUDIO_SIZE
    }
}).fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverArt', maxCount: 1 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 50MB for audio and 5MB for images.'
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
};

const fileType = require('file-type');

// ... (previous content kept, but I'll add more)

// Middleware to validate file content (magic bytes)
const validateFileContent = (fieldName, allowedTypes) => {
    return async (req, res, next) => {
        const file = req.file || (req.files && req.files[fieldName] && req.files[fieldName][0]);

        if (!file) {
            return next();
        }

        try {
            const type = await fileType.fromBuffer(file.buffer);

            if (!type || !allowedTypes.includes(type.mime)) {
                return res.status(400).json({
                    message: `File content validation failed. Expected one of: ${allowedTypes.join(', ')}. Got: ${type ? type.mime : 'unknown'}`
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    uploadAudio,
    uploadCoverArt,
    uploadSongWithCover,
    handleUploadError,
    validateFileContent,
    ALLOWED_AUDIO_TYPES,
    ALLOWED_IMAGE_TYPES
};
