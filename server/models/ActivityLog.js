import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String, // Snapshot of name in case user is deleted
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Automatically delete logs after 24 hours (86400 seconds)
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
