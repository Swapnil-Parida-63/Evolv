import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [messageSchema],
    isSaved: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
});

// TTL Index: Expires after 24 hours (86400 seconds) ONLY if isSaved is false
// Note: partialFilterExpression allows for conditional indexing/expiry
chatSessionSchema.index(
    { lastActivity: 1 },
    {
        expireAfterSeconds: 86400,
        partialFilterExpression: { isSaved: false }
    }
);

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
