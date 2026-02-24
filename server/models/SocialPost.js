import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
    url: { type: String, required: true },
    mimetype: { type: String, required: true } // 'image/jpeg', 'video/mp4', etc.
});

const customFieldSchema = new mongoose.Schema({
    label: String,
    required: { type: Boolean, default: false }
});

const socialPostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['post', 'jobListing'],
        default: 'post'
    },
    content: { type: String, default: '' },
    media: [mediaSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    // Only populated for type='jobListing'
    jobDetails: {
        title: String,
        company: String,
        location: String,
        jobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'] },
        salary: String, // optional
        description: String,
        requirements: [String],
        customFields: [customFieldSchema]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const SocialPost = mongoose.model('SocialPost', socialPostSchema);
export default SocialPost;
