const Song = require('../models/Song');
const User = require('../models/User');

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
const getAllSongs = async (req, res) => {
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single song by ID
// @route   GET /api/songs/:id
// @access  Public
const getSongById = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (song) {
            res.json(song);
        } else {
            res.status(404).json({ message: 'Song not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add or remove a song from the favorites list
// @route   PUT /api/songs/:id/like
// @access  Private
const toggleLikeSong = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const songId = req.params.id;

        const index = user.likedSongs.indexOf(songId);

        if (index > -1) {
            user.likedSongs.splice(index, 1);
            await user.save();
            res.json({ message: 'Removed from favorites list' });
        } else {
            user.likedSongs.push(songId);
            await user.save();
            res.json({ message: 'Added to favorites list' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get the user's favorite songs list
// @route   GET /api/songs/favorites
// @access  Private
const getFavoriteSongs = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('likedSongs');
        
        if (user) {
            res.json(user.likedSongs);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAllSongs,
    getSongById,
    toggleLikeSong,
    getFavoriteSongs,
};
