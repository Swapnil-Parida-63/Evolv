import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalContent: {
        type: String,
        required: true
    },
    analysis: {
        type: Object // Stores the full JSON analysis from AI
    },
    optimizedRewrites: {
        viral_storytelling: { type: String },
        professional_authority: { type: String },
        short_high_engagement: { type: String }
    },
    type: {
        type: String,
        enum: ['scratch', 'optimize'],
        default: 'optimize'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 43200 // 12 hours in seconds (12 * 60 * 60)
    }
});

const Post = mongoose.model('Post', postSchema);

export default Post;
