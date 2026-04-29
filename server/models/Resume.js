import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadDate: { type: Date, default: Date.now },
    resumeText: { type: String },
    contentHash: { type: String, index: true },
    jobReadinessScore: { type: Number, default: 0 },
    analysisResult: { type: mongoose.Schema.Types.Mixed },

    // File storage fields (kept for backwards compatibility, no longer actively used)
    // s3Key: { type: String },
    fileUrl: { type: String },

    roadmapProgress: [{
        skill: String,
        description: String,
        timeline: String,
        priority: { type: String, enum: ['High', 'Medium', 'Low'] },
        microSteps: [{
            step: String,
            isCompleted: { type: Boolean, default: false }
        }],
        isCompleted: { type: Boolean, default: false }
    }]
});

export default mongoose.model('Resume', resumeSchema);
