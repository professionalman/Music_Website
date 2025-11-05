// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Please enter an email address'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
    },
    // --- START NEW FIELD ---
    avatarUrl: {
        type: String,
        default: 'img/avatar.png' // Set a default profile image
    },

    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['user', 'artist', 'admin'],
        default: 'user'
    },
    // Add other fields if needed, for example:
    // avatarUrl: { type: String, default: 'img/default-avatar.png' },
    // likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    // playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }]
    // --- ADD NEW FIELD ---
    likedSongs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song' // Reference to the 'Song' model
    }],
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Middleware: Encrypt the password BEFORE saving to the database
userSchema.pre('save', async function(next) {
    // Only run this function if the password was modified (or if the user is new)
    if (!this.isModified('password')) {
        return next();
    }
    // "Salt" is a random string used to increase security, 12 is the complexity level
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Add a method to the model to compare passwords during login
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
