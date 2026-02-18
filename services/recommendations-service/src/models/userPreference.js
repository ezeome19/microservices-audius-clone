const { mongoose } = require('../../../../shared');

const userPreferenceSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    favoriteGenres: [{ type: String }],
    favoriteArtists: [{ artistId: String, weight: { type: Number, default: 1 } }],
    likedSongs: [{ songId: String, timestamp: { type: Date, default: Date.now } }],
    dislikedSongs: [{ songId: String, timestamp: { type: Date, default: Date.now } }],
    playlistPreferences: {
        preferredLength: { type: Number, default: 30 },
        diversity: { type: Number, min: 0, max: 1, default: 0.5 }
    },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'user_preferences'
});

// Update lastUpdated on save
userPreferenceSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

module.exports = UserPreference;
