const multer = require('multer');
const path = require('path');

// Storage strategy: send audio to public/audio, images to public/img
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const mime = file.mimetype;
        if (mime.startsWith('audio/')) {
            cb(null, 'public/audio');
        } else if (mime.startsWith('image/')) {
            cb(null, 'public/img');
        } else {
            cb(new Error('Unsupported file type'), undefined);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

function checkFileType(file, cb) {
    // Comprehensive audio format support
    const audioExtensions = /\.(mp3|wav|flac|aac|m4a|ogg|wma|aiff|au|webm|opus)$/i;
    const audioMimeTypes = /^audio\/(mpeg|wav|flac|aac|mp4|ogg|x-wma|aiff|basic|webm|opus)/i;

    const isAudio = audioExtensions.test(file.originalname) ||
                   audioMimeTypes.test(file.mimetype) ||
                   file.mimetype.startsWith('audio/');

    const isImage = /jpeg|jpg|png|gif|webp/.test(file.mimetype) || file.mimetype.startsWith('image/');

    if (isAudio || isImage) {
        return cb(null, true);
    }
    cb(new Error('Only audio (MP3, WAV, FLAC, AAC, M4A, OGG, WMA, AIFF, AU, WEBM, OPUS) or image files are allowed'));
}

const uploadSongAssets = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for audio files
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = uploadSongAssets;


