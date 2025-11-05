// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

// Function to generate a token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token expires after 30 days
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            return res.status(400).json({ message: 'Email or username already exists' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role: role || 'user' // Default to 'user' if not provided
        });

        // Return user info and token
        // --- EDITED HERE ---
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl, // Return avatarUrl (default value if not set)
            role: user.role, // Include role
            token: generateToken(user._id)
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('LOGIN attempt for:', email);

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl, // Return saved avatarUrl for the user
                role: user.role, // Include user role
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
