const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    sport: {
        type: String,
        enum: ['running', 'cycling', 'swimming', 'walking', 'hiking'],
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    pace: {
        type: String,
        required: true
    },
    speed: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    calories: {
        type: Number,
        default: 0
    },
    likes: [{
        type: String,
        ref: 'User'
    }],
    comments: [{
        userId: String,
        username: String,
        text: String,
        createdAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
