import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique two-user conversations
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
