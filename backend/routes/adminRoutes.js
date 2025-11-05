const express = require('express');
const path = require('path');
const router = express.Router();
const mongoose = require('mongoose');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const User = require('../models/User');
const uploadSongAssets = require('../middleware/songUploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // ✅ add this
const fs = require('fs');
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
router.post(
    '/songs',
    protect,              
    adminOnly,             
    uploadSongAssets.fields([
        { name: 'audio', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    async (req, res) => {
        // Debug: log auth header to verify token arrival
        console.log('adminRoutes POST /songs - Authorization header:', req.headers && req.headers.authorization);
        try {
            const { title, artistName, artistId } = req.body;
            if (!title || !artistName || !artistId) {
                return res.status(400).json({ message: 'title, artistName and artistId are required' });
            }

            const audioFile = req.files?.audio?.[0];
            if (!audioFile) return res.status(400).json({ message: 'Audio file is required' });
            const coverFile = req.files?.cover?.[0];

            const audioSrc = path.posix.join('audio', path.basename(audioFile.path));
            const artUrl = coverFile ? path.posix.join('img', path.basename(coverFile.path)) : '';

            const newSong = await Song.create({
                title,
                artistName,
                artistId,
                artUrl,
                audioSrc
            });

            return res.status(201).json({ message: 'Song uploaded', song: newSong });
        } catch (err) {
            console.error('Upload song error:', err);
            return res.status(500).json({ message: 'Server error uploading song' });
        }
    }
);

// PUT /api/admin/songs/:id - update song metadata and optionally replace files
router.put(
    '/songs/:id',
    protect,
    adminOnly,
    uploadSongAssets.fields([
        { name: 'audio', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const songId = req.params.id;
            const song = await Song.findById(songId);
            if (!song) return res.status(404).json({ message: 'Song not found' });

            const { title, artistName, artistId } = req.body;

            // Keep track of old files to delete if replaced
            const oldAudio = song.audioSrc;
            const oldArt = song.artUrl;

            if (title) song.title = title;
            if (artistName) song.artistName = artistName;
            if (artistId) song.artistId = artistId;

            const audioFile = req.files?.audio?.[0];
            const coverFile = req.files?.cover?.[0];

            if (audioFile) {
                song.audioSrc = path.posix.join('audio', path.basename(audioFile.path));
            }
            if (coverFile) {
                song.artUrl = path.posix.join('img', path.basename(coverFile.path));
            }

            await song.save();

            // Delete old files if they were replaced
            const publicRoot = path.join(__dirname, '..', '..', 'public');
            try {
                if (audioFile && oldAudio) {
                    const oldAudioAbs = path.join(publicRoot, oldAudio);
                    if (fs.existsSync(oldAudioAbs)) fs.unlinkSync(oldAudioAbs);
                }
                if (coverFile && oldArt) {
                    const oldArtAbs = path.join(publicRoot, oldArt);
                    if (fs.existsSync(oldArtAbs)) fs.unlinkSync(oldArtAbs);
                }
            } catch (fsErr) {
                console.warn('Warning: failed to delete old media files:', fsErr);
            }

            return res.json({ message: 'Song updated', song });
        } catch (err) {
            console.error('Update song error:', err);
            return res.status(500).json({ message: 'Server error updating song' });
        }
    }
);

// DELETE /api/admin/songs/:id - delete song and files
router.delete('/songs/:id', protect, adminOnly, async (req, res) => {
    try {
        const songId = req.params.id;
        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ message: 'Song not found' });

        const publicRoot = path.join(__dirname, '..', '..', 'public');
        try {
            if (song.audioSrc) {
                const audioAbs = path.join(publicRoot, song.audioSrc);
                if (fs.existsSync(audioAbs)) fs.unlinkSync(audioAbs);
            }
            if (song.artUrl) {
                const artAbs = path.join(publicRoot, song.artUrl);
                if (fs.existsSync(artAbs)) fs.unlinkSync(artAbs);
            }
        } catch (fsErr) {
            console.warn('Warning: failed to delete files for song', songId, fsErr);
        }

        await song.deleteOne();
        return res.json({ message: 'Song deleted' });
    } catch (err) {
        console.error('Delete song error:', err);
        return res.status(500).json({ message: 'Server error deleting song' });
    }
});

// --- ARTIST/USER MANAGEMENT ROUTES ---

// POST /api/admin/artists - Create new artist (user with role='artist')
router.post('/artists', protect, adminOnly, async (req, res) => {
    // Handle file upload separately
    const uploadSingle = upload.single('avatar');
    
    uploadSingle(req, res, async (uploadErr) => {
        if (uploadErr) {
            console.error('Upload error:', uploadErr);
            return res.status(400).json({ message: 'File upload error: ' + uploadErr.message });
        }
        
        try {
            const { username, email, password, role } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ message: 'username, email, and password are required' });
            }

            // Check if user already exists
            const userExists = await User.findOne({ $or: [{ email }, { username }] });
            if (userExists) {
                return res.status(400).json({ message: 'Username or email already exists' });
            }

            // Create new user with artist role
            const newArtist = await User.create({
                username,
                email,
                password,
                role: role || 'artist'
            });

            // Handle avatar upload
            if (req.file) {
                newArtist.avatarUrl = path.posix.join('img', path.basename(req.file.path));
                await newArtist.save();
            }

            return res.status(201).json({
                message: 'Artist created',
                artist: {
                    _id: newArtist._id,
                    username: newArtist.username,
                    email: newArtist.email,
                    avatarUrl: newArtist.avatarUrl,
                    name: newArtist.username
                }
            });
        } catch (err) {
            console.error('Create artist error:', err);
            return res.status(500).json({ message: 'Server error creating artist', error: err.message });
        }
    });
});

// PUT /api/admin/artists/:id - Update artist (user with role='artist')
router.put('/artists/:id', protect, adminOnly, async (req, res) => {
    // Handle file upload separately
    const uploadSingle = upload.single('avatar');
    
    uploadSingle(req, res, async (uploadErr) => {
        if (uploadErr) {
            console.error('Upload error:', uploadErr);
            return res.status(400).json({ message: 'File upload error: ' + uploadErr.message });
        }
        
        try {
            const artistId = req.params.id;
            const artist = await User.findById(artistId);
            
            if (!artist) {
                return res.status(404).json({ message: 'Artist not found' });
            }

            if (artist.role !== 'artist') {
                return res.status(400).json({ message: 'User is not an artist' });
            }

            const { username, email } = req.body;

            // Check if username/email already exists (excluding current artist)
            if (username || email) {
                const existingUser = await User.findOne({
                    $or: [
                        ...(username ? [{ username }] : []),
                        ...(email ? [{ email }] : [])
                    ],
                    _id: { $ne: artistId }
                });

                if (existingUser) {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
            }

            if (username) artist.username = username;
            if (email) artist.email = email;

            // Handle avatar upload
            if (req.file) {
                const oldAvatar = artist.avatarUrl;
                artist.avatarUrl = path.posix.join('img', path.basename(req.file.path));
                
                // Delete old avatar if exists and is not default
                if (oldAvatar && oldAvatar !== 'img/avatar.png' && oldAvatar !== 'img/singer-holder.png') {
                    const publicRoot = path.join(__dirname, '..', '..', 'public');
                    const oldAvatarAbs = path.join(publicRoot, oldAvatar);
                    try {
                        if (fs.existsSync(oldAvatarAbs)) {
                            fs.unlinkSync(oldAvatarAbs);
                        }
                    } catch (fsErr) {
                        console.warn('Warning: failed to delete old avatar:', fsErr);
                    }
                }
            }

            await artist.save();

            return res.json({
                message: 'Artist updated',
                artist: {
                    _id: artist._id,
                    username: artist.username,
                    email: artist.email,
                    avatarUrl: artist.avatarUrl,
                    name: artist.username // For compatibility
                }
            });
        } catch (err) {
            console.error('Update artist error:', err);
            return res.status(500).json({ message: 'Server error updating artist', error: err.message });
        }
    });
});

// DELETE /api/admin/artists/:id - Delete artist (from both User model and Artist model)
router.delete('/artists/:id', protect, adminOnly, async (req, res) => {
    try {
        const artistId = req.params.id;
        
        console.log('[DELETE ARTIST] Attempting to delete artist with ID:', artistId);
        
        if (!artistId) {
            return res.status(400).json({ message: 'Artist ID is required' });
        }

        let artist = null;
        let artistType = null; // 'user' or 'artist'
        const publicRoot = path.join(__dirname, '..', '..', 'public');

        // First, try to find in User model (if it's a valid ObjectId)
        const isValidObjectId = mongoose.Types.ObjectId.isValid(artistId);
        console.log('[DELETE ARTIST] Is valid ObjectId:', isValidObjectId);
        
        if (isValidObjectId) {
            try {
                artist = await User.findById(artistId);
                console.log('[DELETE ARTIST] Found in User model:', artist ? 'Yes' : 'No');
                if (artist && artist.role === 'artist') {
                    artistType = 'user';
                    console.log('[DELETE ARTIST] Artist type: User model');
                } else {
                    artist = null; // Reset if not an artist
                }
            } catch (err) {
                console.error('[DELETE ARTIST] Error checking User model:', err.message);
            }
        }

        // If not found in User model, try Artist model (uses String _id)
        if (!artist) {
            try {
                artist = await Artist.findById(artistId);
                console.log('[DELETE ARTIST] Found in Artist model:', artist ? 'Yes' : 'No');
                if (artist) {
                    artistType = 'artist';
                    console.log('[DELETE ARTIST] Artist type: Artist model');
                }
            } catch (err) {
                console.error('[DELETE ARTIST] Error checking Artist model:', err.message);
            }
        }

        if (!artist) {
            console.log('[DELETE ARTIST] Artist not found in either model');
            return res.status(404).json({ message: 'Artist not found' });
        }

        console.log('[DELETE ARTIST] Artist found, type:', artistType);

        // Delete avatar if exists and is not default
        const avatarUrl = artist.avatarUrl || artist.avatar;
        if (avatarUrl && 
            avatarUrl !== 'img/avatar.png' && 
            avatarUrl !== 'img/singer-holder.png' && 
            avatarUrl !== 'img/default-avatar.png') {
            
            let avatarAbs;
            
            // Handle different path formats
            if (avatarUrl.startsWith('uploads/')) {
                avatarAbs = path.join(publicRoot, avatarUrl);
            } else if (avatarUrl.startsWith('img/') || avatarUrl.startsWith('/img/')) {
                const cleanPath = avatarUrl.replace(/^\/+/, ''); // Remove leading slashes
                avatarAbs = path.join(publicRoot, cleanPath);
            } else {
                avatarAbs = path.join(publicRoot, avatarUrl);
            }
            
            try {
                if (fs.existsSync(avatarAbs)) {
                    fs.unlinkSync(avatarAbs);
                    console.log('[DELETE ARTIST] Deleted avatar:', avatarAbs);
                } else {
                    console.log('[DELETE ARTIST] Avatar file not found:', avatarAbs);
                }
            } catch (fsErr) {
                console.warn('[DELETE ARTIST] Warning: failed to delete avatar:', fsErr.message);
                // Don't fail the deletion if avatar deletion fails
            }
        }

        // Delete banner if exists (for Artist model)
        if (artistType === 'artist' && artist.bannerUrl) {
            try {
                const bannerAbs = path.join(publicRoot, artist.bannerUrl);
                if (fs.existsSync(bannerAbs)) {
                    fs.unlinkSync(bannerAbs);
                    console.log('[DELETE ARTIST] Deleted banner:', bannerAbs);
                }
            } catch (fsErr) {
                console.warn('[DELETE ARTIST] Warning: failed to delete banner:', fsErr.message);
            }
        }

        // Delete the artist from the appropriate model
        try {
            if (artistType === 'user') {
                console.log('[DELETE ARTIST] Deleting from User model');
                await User.findByIdAndDelete(artistId);
                console.log('[DELETE ARTIST] Successfully deleted from User model');
            } else if (artistType === 'artist') {
                console.log('[DELETE ARTIST] Deleting from Artist model');
                await Artist.findByIdAndDelete(artistId);
                console.log('[DELETE ARTIST] Successfully deleted from Artist model');
            } else {
                throw new Error('Unknown artist type');
            }
        } catch (deleteErr) {
            console.error('[DELETE ARTIST] Error during deletion:', deleteErr);
            throw deleteErr;
        }
        
        console.log('[DELETE ARTIST] Artist deleted successfully');
        return res.json({ message: 'Artist deleted successfully' });
    } catch (err) {
        console.error('[DELETE ARTIST] Delete artist error:', err);
        console.error('[DELETE ARTIST] Error stack:', err.stack);
        return res.status(500).json({ 
            message: 'Server error deleting artist', 
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

module.exports = router;


