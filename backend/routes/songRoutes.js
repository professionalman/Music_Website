// backend/routes/songRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import middleware
const { 
    getAllSongs, 
    getSongById, 
    toggleLikeSong, 
    getFavoriteSongs 
} = require('../controllers/songController'); // Import controller functions

// Get all songs - must be before /:id routes
router.get('/', getAllSongs);

// Get user's favorite songs - must be before /:id routes
router.get('/favorites', protect, getFavoriteSongs);

// Get a single song by ID
router.get('/:id', getSongById);

// Like or unlike a song
router.put('/:id/like', protect, toggleLikeSong);

module.exports = router;
