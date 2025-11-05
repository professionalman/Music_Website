const mongoose = require('mongoose');
const playlistSchema = new mongoose.Schema({
    _id: { type: String, required: true }, 
    title: { type: String, required: true },
    description: String,
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }] 
});
module.exports = mongoose.model('Playlist', playlistSchema);