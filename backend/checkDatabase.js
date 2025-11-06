// Quick script to check database contents
require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('./models/Song');
const User = require('./models/User');
const Playlist = require('./models/Playlist');

async function checkDatabase() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully!\n');

        // Check songs
        const songCount = await Song.countDocuments();
        console.log(`📀 Songs in database: ${songCount}`);
        if (songCount > 0) {
            const sampleSongs = await Song.find().limit(5);
            console.log('Sample songs:');
            sampleSongs.forEach(song => {
                console.log(`  - ${song.title} by ${song.artistName}`);
            });
        }
        console.log('');

        // Check users
        const userCount = await User.countDocuments();
        console.log(`👤 Users in database: ${userCount}`);
        if (userCount > 0) {
            const sampleUsers = await User.find().limit(5).select('username role');
            console.log('Sample users:');
            sampleUsers.forEach(user => {
                console.log(`  - ${user.username} (${user.role})`);
            });
        }
        console.log('');

        // Check playlists
        const playlistCount = await Playlist.countDocuments();
        console.log(`🎵 Playlists in database: ${playlistCount}`);
        if (playlistCount > 0) {
            const samplePlaylists = await Playlist.find().limit(5).select('title');
            console.log('Sample playlists:');
            samplePlaylists.forEach(playlist => {
                console.log(`  - ${playlist.title}`);
            });
        }
        console.log('');

        // Check database name
        console.log('Database name:', mongoose.connection.db.databaseName);
        console.log('Collections:', await mongoose.connection.db.listCollections().toArray());

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();
