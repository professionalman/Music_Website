const mongoose = require('mongoose');
const artistSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: String,
    bannerUrl: String,
    bio: String,
    monthlyListeners: String
});
module.exports = mongoose.model('Artist', artistSchema);