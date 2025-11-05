// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configure file storage location
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Save uploaded files to the folder public/img (for avatars)
        const dest = 'public/img';
        const fs = require('fs');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.user && req.user._id ? req.user._id.toString() : 'unknown';
        cb(null, userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Validate file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)!'));
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
    