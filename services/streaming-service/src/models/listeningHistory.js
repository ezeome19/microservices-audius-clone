const { mongoose } = require('../../../../shared');


const listeningHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    songId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    device: { type: String, enum: ['web', 'mobile', 'desktop'], default: 'web' },
    location: { type: String }
}, {
    timestamps: true,
    collection: 'listening_history'
});

// Compound index for efficient queries
listeningHistorySchema.index({ userId: 1, timestamp: -1 });
listeningHistorySchema.index({ songId: 1, timestamp: -1 });

const ListeningHistory = mongoose.model('ListeningHistory', listeningHistorySchema);

module.exports = ListeningHistory;
