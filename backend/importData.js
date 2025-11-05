// backend/importData.js (Safe Version)

// Import required libraries
require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Song = require('./models/Song');
const Artist = require('./models/Artist');
const Playlist = require('./models/Playlist');
// DO NOT import the User model here to prevent accidental modifications

// Import music data
const allMusicData = require('./music.js'); // Adjust the path if needed

// --- CONNECT TO DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected for data import...');
        importData();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --- DATA IMPORT HANDLER ---
const importData = async () => {
    try {
        // --- 1. SAFELY CLEAR OLD DATA ---
        // IMPORTANT CHANGE: Instead of deleting the entire database,
        // we only clear specific collections (Songs, Artists, Playlists).
        // The 'users' collection and other collections remain untouched.
        console.log('Clearing existing music data (Songs, Artists, Playlists)...');
        await Song.deleteMany({});
        await Artist.deleteMany({});
        await Playlist.deleteMany({});
        console.log('Music data cleared successfully. User data remains untouched.');

        // --- 2. PROCESS AND PREPARE NEW DATA ---
        console.log('Processing data from music.js...');
        const allSongsFromJs = allMusicData.flatMap(section => section.songs);

        const artistsMap = new Map();
        allSongsFromJs.forEach(song => {
            if (song.displayArtist && song.displayArtist.id) {
                if (!artistsMap.has(song.displayArtist.id)) {
                    artistsMap.set(song.displayArtist.id, {
                        _id: song.displayArtist.id,
                        name: song.displayArtist.name,
                        avatarUrl: song.artUrl,
                        bannerUrl: song.artUrl // Temporarily use the same image
                    });
                }
            }
        });
        const uniqueArtistsToInsert = Array.from(artistsMap.values());

        // Create a map to efficiently track new song IDs
        const songIdMap = new Map();
        const songsToInsert = allSongsFromJs.map(song => {
            const newSongId = new mongoose.Types.ObjectId();
            songIdMap.set(song.audioSrc, newSongId); // Store new ID using audioSrc as key
            return {
                _id: newSongId,
                title: song.title,
                artistName: song.displayArtist ? song.displayArtist.name : 'Unknown Artist',
                artistId: song.displayArtist ? song.displayArtist.id : null,
                artUrl: song.artUrl,
                audioSrc: song.audioSrc,
                plays: parseInt(String(song.plays).replace(/\D/g, '')) || Math.floor(Math.random() * 100000),
                isFavorite: song.isFavorite || false
            };
        });

        // --- 3. INSERT DATA INTO DATABASE ---
        console.log(`Inserting ${uniqueArtistsToInsert.length} new artists...`);
        if (uniqueArtistsToInsert.length > 0) {
            await Artist.insertMany(uniqueArtistsToInsert);
        }
        console.log('Artists inserted.');

        console.log(`Inserting ${songsToInsert.length} new songs...`);
        if (songsToInsert.length > 0) {
            await Song.insertMany(songsToInsert);
        }
        console.log('Songs inserted.');

        // --- 4. CREATE PLAYLISTS AND LINK SONGS ---
        console.log('Creating playlists and linking songs...');
        const playlistsToInsert = allMusicData.map(section => {
            const songIdsForPlaylist = section.songs
                .map(songJs => songIdMap.get(songJs.audioSrc)) // Get new song IDs from map
                .filter(id => id); // Remove undefined values if not found

            return {
                _id: section.id,
                title: section.title,
                description: section.description || `A collection of the best songs from the ${section.title} genre.`,
                songs: songIdsForPlaylist
            };
        });

        if (playlistsToInsert.length > 0) {
            await Playlist.insertMany(playlistsToInsert);
        }
        console.log(`${playlistsToInsert.length} playlists created and linked.`);
        
        console.log('-----------------------------------');
        console.log('✅ DATA IMPORTED SUCCESSFULLY! ✅');
        console.log('-----------------------------------');
        process.exit();

    } catch (error) {
        console.error('Error during data import:', error);
        process.exit(1);
    }
};
