// backend/server.js

require('dotenv').config();
const express = require('express');
const path = require('path'); // Import Node.js 'path' module
const mongoose = require('mongoose');
const cors = require('cors');

// --- IMPORT ALL MODELS HERE ---
const Song = require('./models/Song');
const Artist = require('./models/Artist');
const Playlist = require('./models/Playlist');
const User = require('./models/User'); // Import User model
const authRoutes = require('./routes/authRoutes'); // Import authentication routes
const songRoutes = require('./routes/songRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
// ------------------------------------------
const { protect, protectPage, adminOnly } = require('./middleware/authMiddleware'); 

const app = express();

// --- APP CONFIGURATION ---
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increase JSON body limit
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Increase URL-encoded body limit

// 1. Configure EJS as the view engine
app.set('view engine', 'ejs');
// 2. Set the directory containing view files
app.set('views', path.join(__dirname, 'views'));

// 3. Configure the Public folder to serve static files (CSS, JS, images)
// This points Express to the `public` directory one level up
// Configure MIME types for audio files, especially M4A
const serveStatic = express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
        // Set correct MIME type for M4A files
        if (filePath.endsWith('.m4a')) {
            res.setHeader('Content-Type', 'audio/mp4');
        } else if (filePath.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        } else if (filePath.endsWith('.flac')) {
            res.setHeader('Content-Type', 'audio/flac');
        } else if (filePath.endsWith('.ogg')) {
            res.setHeader('Content-Type', 'audio/ogg');
        } else if (filePath.endsWith('.wav')) {
            res.setHeader('Content-Type', 'audio/wav');
        } else if (filePath.endsWith('.aac')) {
            res.setHeader('Content-Type', 'audio/aac');
        } else if (filePath.endsWith('.webm')) {
            res.setHeader('Content-Type', 'audio/webm');
        } else if (filePath.endsWith('.opus')) {
            res.setHeader('Content-Type', 'audio/opus');
        }
    }
});
app.use(serveStatic);

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/users', userRoutes);

// --- Database Connection ---
console.log('MONGO_URI from env:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));


// Route: Home page
app.get('/', async (req, res) => {
    try {
        // Fetch data from the database
        const sections = await Playlist.find().populate('songs');

        // Render index.ejs and pass data
        // Note: welcomeMessage is now handled by client-side JavaScript (main.js)
        // which reads the username from localStorage after login
        res.render('index', {
            title: 'MyMusic Player - Home',
            sections: sections // Pass all sections to the view
        });

    } catch (error) {
        console.error("Error rendering homepage:", error);
        res.status(500).send("Failed to load page");
    }
});

// --- Route: All Playlists ---
app.get('/all_playlists', async (req, res) => {
    try {
        // Get all playlists from the database
        // Populate the first song to get the cover art
        const playlists = await Playlist.find().populate({
            path: 'songs',
            perDocumentLimit: 1 // Only get the first song for each playlist
        });

        res.render('all_playlists', {
            title: 'All Playlists - My Music Player',
            playlists: playlists // Pass playlists into the view
        });

    } catch (error) {
        console.error("Error rendering all playlists page:", error);
        res.status(500).send("Failed to load page");
    }
});

// --- Route: Playlist Details ---
app.get('/playlist', async (req, res) => {
    // Get playlist ID from query parameter (?id=...)
    const playlistId = req.query.id;

    if (!playlistId) {
        return res.status(400).render('error', { 
            title: "Error",
            message: "Playlist ID not found." 
        });
    }

    try {
        // Find playlist by ID and populate all its songs
        const playlist = await Playlist.findById(playlistId).populate('songs');

        if (!playlist) {
            // If playlist not found, render 404 error page
            return res.status(404).render('error', { 
                title: "Not Found",
                message: "The requested playlist does not exist or has been removed." 
            });
        }

        // Render playlist.ejs and pass the found playlist
        res.render('playlist', {
            title: `${playlist.title} - My Music Player`,
            playlist: playlist // Pass the entire playlist object into the view
        });

    } catch (error) {
        console.error(`Error rendering playlist page for ID ${playlistId}:`, error);
        res.status(500).render('error', { 
            title: "Server Error",
            message: "An error occurred while loading the playlist page."
        });
    }
});

// --- Route: Artist Details ---
app.get('/artist', async (req, res) => {
    const artistId = req.query.artistId;

    if (!artistId) {
        return res.status(400).render('error', { 
            title: "Error",
            message: "Artist ID not found." 
        });
    }

    try {
        // Try to find artist in User model first (users with role='artist')
        let artist = null;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(artistId);
        
        if (isValidObjectId) {
            // First try User model
            artist = await User.findOne({ _id: artistId, role: 'artist' }).lean();
            console.log(`[ARTIST PAGE] Found in User model:`, artist ? 'Yes' : 'No');
        }
        
        // If not found in User model, try Artist model
        if (!artist) {
            artist = await Artist.findById(artistId).lean();
            console.log(`[ARTIST PAGE] Found in Artist model:`, artist ? 'Yes' : 'No');
        }

        if (!artist) {
            return res.status(404).render('error', { 
                title: "Not Found",
                message: "The requested artist does not exist." 
            });
        }

        // Normalize artist data (User model uses 'username', Artist model uses 'name')
        const artistData = {
            _id: artist._id,
            name: artist.name || artist.username || 'Unknown Artist',
            avatarUrl: artist.avatarUrl || artist.avatar || 'img/singer-holder.png',
            bio: artist.bio || '',
            email: artist.email || ''
        };

        // Find all songs by this artist
        const songs = await Song.find({ artistId: artistId }).sort({ plays: -1 });
        artistData.songs = songs;

        console.log(`[ARTIST PAGE] Rendering artist: ${artistData.name} with ${songs.length} songs`);

        // Render artist.ejs and pass merged data
        res.render('artist', {
            title: `${artistData.name} - My Music Player`,
            artist: artistData
        });

    } catch (error) {
        console.error(`Error rendering artist page for ID ${artistId}:`, error);
        res.status(500).render('error', { 
            title: "Server Error",
            message: "An error occurred while loading the artist page."
        });
    }
});

// --- Route: Artists List ---
app.get('/artists', async (req, res) => {
    try {
        // Get artists from both User model (users with role='artist') and Artist model
        const [artistUsers, artistDocs] = await Promise.all([
            User.find({ role: 'artist' }).sort({ username: 1 }).lean(),
            Artist.find().sort({ name: 1 }).lean()
        ]);

        console.log(`[ARTISTS ROUTE] Found ${artistUsers.length} artists from User model (role='artist')`);
        console.log(`[ARTISTS ROUTE] Found ${artistDocs.length} artists from Artist model`);
        
        // Debug: Log sample data
        if (artistUsers.length > 0) {
            console.log('[ARTISTS ROUTE] Sample User artist:', JSON.stringify(artistUsers[0], null, 2));
        }
        if (artistDocs.length > 0) {
            console.log('[ARTISTS ROUTE] Sample Artist model:', JSON.stringify(artistDocs[0], null, 2));
        }

        // Map user fields to match artist template expectations
        const artistsFromUsers = artistUsers.map(user => {
            const artist = {
                _id: user._id,
                name: user.username || user.name || 'Unknown Artist',
                avatarUrl: user.avatarUrl || 'img/singer-holder.png',
                source: 'user'
            };
            return artist;
        });

        // Map Artist model documents
        const artistsFromModel = artistDocs.map(artist => {
            const mapped = {
                _id: artist._id,
                name: artist.name || 'Unknown Artist',
                avatarUrl: artist.avatarUrl || 'img/singer-holder.png',
                source: 'artist'
            };
            return mapped;
        });

        // Combine both sources - use array to preserve all artists
        const allArtists = [...artistsFromUsers, ...artistsFromModel];
        console.log(`[ARTISTS ROUTE] Combined artists: ${allArtists.length}`);

        // Remove duplicates based on _id (convert to string for comparison)
        const uniqueArtistsMap = new Map();
        allArtists.forEach(artist => {
            if (!artist || !artist._id) {
                console.warn('[ARTISTS ROUTE] Skipping invalid artist:', artist);
                return;
            }
            const idStr = artist._id.toString();
            if (idStr && !uniqueArtistsMap.has(idStr)) {
                uniqueArtistsMap.set(idStr, artist);
            }
        });

        const finalArtists = Array.from(uniqueArtistsMap.values()).sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        console.log(`[ARTISTS ROUTE] Total unique artists to display: ${finalArtists.length}`);
        if (finalArtists.length > 0) {
            console.log(`[ARTISTS ROUTE] First artist:`, JSON.stringify(finalArtists[0], null, 2));
        }

        // Ensure artists is always an array
        const artistsArray = Array.isArray(finalArtists) ? finalArtists : [];
        
        console.log(`[ARTISTS ROUTE] Rendering with ${artistsArray.length} artists`);
        
        // Render artists.ejs and pass artists array
        res.render('artists', {
            title: 'Artists - My Music Player',
            artists: artistsArray // 'artists' is the variable name used in the .ejs file
        });

    } catch (error) {
        console.error("Error rendering artists list page:", error);
        res.status(500).render('error', {
            title: "Server Error",
            message: "An error occurred while loading the artists list."
        });
    }
});

// --- Route: Search page ---
app.get('/search', (req, res) => {
    // Render static page, no initial data needed
    res.render('search', {
        title: 'Search - My Music Player'
    });
});

// --- Route: About page ---
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About - My Music Player'
    });
});

// --- Route: Cookie Policy page ---
app.get('/cookie', (req, res) => {
    res.render('cookie', {
        title: 'Cookie Policy - My Music Player'
    });
});

// --- Route: Legal page ---
app.get('/legal', (req, res) => {
    res.render('legal', {
        title: 'Legal - My Music Player'
    });
});

// --- Route: Privacy page ---
app.get('/privacy', (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy - My Music Player'
    });
});

// --- Route: Tutorial page ---
app.get('/tutorial', (req, res) => {
    res.render('tutorial', {
        title: 'User Guide - My Music Player'
    });
});

// --- Route: Version History page ---
app.get('/version', (req, res) => {
    res.render('version', {
        title: 'Version History - My Music Player'
    });
});

// --- Route: Admin Upload page ---
app.get('/admin', (req, res) => {
    res.render('admin', {
        title: 'Admin - Upload Song'
    });
});

// Admin single-song edit page (client enforces auth via token)
app.get('/admin_song', (req, res) => {
    res.render('admin_song', { title: 'Admin - Edit Song' });
});

// Admin manage songs page (client enforces auth via token)
app.get('/admin_songs', (req, res) => {
    console.log("Admin songs page requested");
    res.render('admin_songs', { title: 'Admin - Manage Songs' });
});


// --- Routes: Login and Register pages ---
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login - My Music Player'
    });
});

app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register - My Music Player'
    });
});

// --- Route: Library page ---
// (Ensure this route exists and is correct)
app.get('/library', (req, res) => {
    // We may protect this route later with middleware; for now just render
    res.render('library', { 
        title: 'Library - My Music Player'
    });
});

app.get('/favorite', (req, res) => {
    // We may protect this route later with middleware; for now just render
    res.render('favorite', { 
        title: 'Favorite Songs - My Music Player'
    });
});



app.get('/account', protectPage, (req, res) => {
    // For page routes, we don't pass user from server
    // Client-side JS will fetch user data via API
    res.render('account', {
        title: 'Account Settings - My Music Player',
        user: null // Client-side will handle fetching user data
    });
});

// --- ===== API ROUTES (see top of file for main route mounting) ===== ---
// --- 1. API for Artists ---

// GET /api/artists - Get all artists
app.get('/api/artists', async (req, res) => {
    try {
        // First, let's check ALL users to see what roles exist
        const allUsers = await User.find().lean();
        console.log(`[API /api/artists] Total users in database: ${allUsers.length}`);
        if (allUsers.length > 0) {
            console.log(`[API /api/artists] Sample user roles:`, allUsers.map(u => ({ username: u.username, role: u.role })));
        }
        
        // Get artists from both User model (users with role='artist') and Artist model
        const [artistUsers, artistDocs] = await Promise.all([
            User.find({ role: 'artist' }).sort({ username: 1 }).lean(),
            Artist.find().sort({ name: 1 }).lean()
        ]);

        console.log(`[API /api/artists] Found ${artistUsers.length} artists from User model (role='artist')`);
        console.log(`[API /api/artists] Found ${artistDocs.length} artists from Artist model`);
        
        // DEBUG: If no artists found, let's check if artists exist with different criteria
        if (artistUsers.length === 0) {
            const usersWithArtistInName = await User.find({ username: /artist/i }).lean();
            console.log(`[API /api/artists] DEBUG: Users with 'artist' in username: ${usersWithArtistInName.length}`);
        }
        
        // Map user fields to match artist structure
        const artistsFromUsers = artistUsers.map(user => ({
            _id: user._id,
            name: user.username || user.name || 'Unknown Artist',
            username: user.username,
            avatarUrl: user.avatarUrl || 'img/singer-holder.png',
            source: 'user'
        }));

        // Map Artist model documents
        const artistsFromModel = artistDocs.map(artist => ({
            _id: artist._id,
            name: artist.name || 'Unknown Artist',
            avatarUrl: artist.avatarUrl || artist.avatar || 'img/singer-holder.png',
            source: 'artist'
        }));

        // Combine both sources
        const allArtists = [...artistsFromUsers, ...artistsFromModel];
        
        // Remove duplicates based on _id
        const uniqueArtistsMap = new Map();
        allArtists.forEach(artist => {
            const idStr = artist._id.toString();
            if (!uniqueArtistsMap.has(idStr)) {
                uniqueArtistsMap.set(idStr, artist);
            }
        });

        const finalArtists = Array.from(uniqueArtistsMap.values()).sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        console.log(`[API /api/artists] Returning ${finalArtists.length} unique artists`);
        res.json(finalArtists);
    } catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({ message: "Server error while fetching artists." });
    }
});

// GET /api/artists/:id - Get artist detail and their songs
app.get('/api/artists/:id', async (req, res) => {
    try {
        const artistId = req.params.id;

        if (!artistId) {
            return res.status(400).json({ message: "Artist ID is required." });
        }

        // Try to fetch from User model first (since artists are stored as Users with role='artist')
        let artist = null;
        
        // Check if artistId is a valid MongoDB ObjectId format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(artistId);
        
        if (isValidObjectId) {
            try {
                artist = await User.findById(artistId).lean();
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        }
        
        // If not found in User, try Artist model (for backward compatibility)
        if (!artist) {
            try {
                artist = await Artist.findById(artistId).lean();
            } catch (err) {
                console.error('Error fetching artist model:', err);
            }
        }
        
        // If still not found, check if it's a User with artist role
        if (!artist && isValidObjectId) {
            try {
                artist = await User.findOne({ _id: artistId, role: 'artist' }).lean();
            } catch (err) {
                console.error('Error fetching artist user:', err);
            }
        }

        if (!artist) {
            return res.status(404).json({ message: "Artist not found." });
        }

        // Get songs by this artist
        let songs = [];
        try {
            songs = await Song.find({ artistId: artistId }).sort({ plays: -1 }).lean();
        } catch (err) {
            console.error('Error fetching songs:', err);
        }

        // Format response - if it's a User, map fields appropriately
        const artistData = { ...artist };
        if (artist.role && artist.role === 'artist') {
            // Map User fields to artist format
            artistData.name = artistData.username || artistData.name;
        }

        // Merge results and return
        return res.json({ ...artistData, songs: songs });

    } catch (err) {
        console.error(`Error fetching artist ${req.params.id}:`, err);
        return res.status(500).json({ message: "Server error while fetching artist info.", error: err.message });
    }
});


// --- 2. API for Songs ---

// GET /api/songs - Get all songs (for library)
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (err) {
        console.error("Error fetching songs:", err);
        res.status(500).json({ message: "Server error while fetching songs." });
    }
});

// GET /api/songs/:id - Get details of a song
app.get('/api/songs/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: "Song not found." });
        }
        res.json(song);
    } catch (err) {
        console.error(`Error fetching song ${req.params.id}:`, err);
        res.status(500).json({ message: "Server error while fetching song info." });
    }
});


// --- 3. API for Playlists ---

// GET /api/playlists - Get all playlists (for all_playlists page)
app.get('/api/playlists', async (req, res) => {
    try {
        // Only get basic fields, no need to populate all songs
        const playlists = await Playlist.find().select('title'); // Only _id and title
        res.json(playlists);
    } catch (err) {
        console.error("Error fetching playlists:", err);
        res.status(500).json({ message: "Server error while fetching playlists." });
    }
});

// GET /api/playlists/sections - Get sections for home page
// This API fetches playlists with song details
app.get('/api/playlists/sections', async (req, res) => {
    try {
        // Use populate to get song details within playlists
        const playlistsWithSongs = await Playlist.find().populate('songs');
        res.json(playlistsWithSongs);
    } catch (err) {
        console.error("Error fetching playlist sections:", err);
        res.status(500).json({ message: "Server error while fetching sections." });
    }
});

// GET /api/playlists/:id - Get playlist details
app.get('/api/playlists/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).populate('songs');
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found." });
        }
        res.json(playlist);
    } catch (err) {
        console.error(`Error fetching playlist ${req.params.id}:`, err);
        res.status(500).json({ message: "Server error while fetching playlist details." });
    }
});

// --- API Route: Search ---
app.get('/api/search', async (req, res) => {
    // Get search query from URL, e.g., /api/search?q=...
    const query = req.query.q;

    if (!query) {
        // If no query, return empty results
        return res.json({ artists: [], songs: [] });
    }

    try {
        // Create a case-insensitive regular expression for searching
        const regex = new RegExp(query, 'i');

        // Use Promise.all to search both collections in parallel
        const [foundArtists, foundSongs] = await Promise.all([
            // Find artists whose names match the regex
            Artist.find({ name: { $regex: regex } }).limit(10), // Limit 10 results
            // Find songs whose title OR artist name matches the regex
            Song.find({ 
                $or: [
                    { title: { $regex: regex } }, 
                    { artistName: { $regex: regex } }
                ]
            }).limit(50) // Limit 50 results
        ]);
        
        // Return results as a JSON object
        res.json({
            artists: foundArtists,
            songs: foundSongs
        });

    } catch (error) {
        console.error("API search error:", error);
        res.status(500).json({ message: "Server error while performing search." });
    }
});

// --- Error Handler for API Routes ---
app.use((err, req, res, next) => {
    // If it's an API route, return JSON error
    if (req.path && req.path.startsWith('/api/')) {
        console.error('API Error:', err);
        return res.status(err.status || 500).json({
            message: err.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
    // Otherwise, let Express handle it (render HTML error page)
    next(err);
});

// 404 handler for API routes - return JSON instead of HTML
// This should be after all other routes
app.use((req, res, next) => {
    if (req.path && req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    next();
});

// --- Start Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT} http://localhost:${PORT}/`));