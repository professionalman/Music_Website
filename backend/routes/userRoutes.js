// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Make sure it's imported
const multer = require('multer'); // Import multer for error checking
// Import the configured upload middleware from multer


// @desc    Update user information
// @route   PUT /api/user/update
// @access  Private
router.put('/update', protect, async (req, res) => {
    console.log('[UPDATE USER] Request body:', req.body);
    console.log('[UPDATE USER] User ID:', req.user._id);
    
    const user = await User.findById(req.user._id);

    if (user) {
        // Check if the new username/email already exists (excluding the current user)
        const { username, email } = req.body;
        
        console.log('[UPDATE USER] Current username:', user.username, '-> New username:', username);
        console.log('[UPDATE USER] Current email:', user.email, '-> New email:', email);
        
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }], 
            _id: { $ne: user._id } 
        });

        if (existingUser) {
            console.log('[UPDATE USER] Conflict! Username or email already exists');
            return res.status(400).json({ message: "Username or Email is already in use." });
        }

        user.username = username || user.username;
        user.email = email || user.email;
        // Add other fields here if you allow updates
        
        const updatedUser = await user.save();
        
        console.log('[UPDATE USER] Successfully updated to:', updatedUser.username, updatedUser.email);
        
        // Return the updated user info (without password)
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email
        });
    } else {
        console.log('[UPDATE USER] User not found');
        res.status(404).json({ message: 'User not found' });
    }
});

router.get('/profile', protect, (req, res) => {
    // The 'protect' middleware attaches the user to req.user
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
        user.password = newPassword; // The pre-save middleware will automatically hash it
        await user.save();
        res.json({ message: 'Password changed successfully.' });
    } else {
        res.status(401).json({ message: 'Current password is incorrect.' });
    }
});

// @desc    Change avatar
// @route   PUT /api/user/change-avatar
// @access  Private
router.put('/change-avatar', protect, (req, res) => {
    // Use upload.single as a middleware with a callback to catch errors
    upload.single('avatar')(req, res, async function (err) {
        // --- Handle Multer errors first ---
        if (err instanceof multer.MulterError) {
            // Multer-related errors (file too large, too many files, etc.)
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            // Other errors from fileFilter (e.g., invalid file type)
            return res.status(400).json({ message: err.message });
        }

        // --- If no upload errors, continue processing ---
        try {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            let newAvatarPath = '';

            if (req.file) {
                newAvatarPath = req.file.path.replace(/\\/g, '/').replace('public/', '');
            } else if (req.body.defaultAvatarPath) {
                newAvatarPath = req.body.defaultAvatarPath;
            } else {
                return res.status(400).json({ message: 'Please upload or select an image.' });
            }

            user.avatarUrl = newAvatarPath;
            await user.save();
            
            res.json({ 
                message: 'Avatar updated successfully.', 
                avatarUrl: user.avatarUrl 
            });

        } catch (serverError) {
            console.error("Server error inside avatar logic:", serverError);
            res.status(500).json({ message: "Internal server error while processing avatar." });
        }
    });
});

module.exports = router;
