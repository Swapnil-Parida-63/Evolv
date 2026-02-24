import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadDate: { type: Date, default: Date.now },
    resumeText: { type: String },
    contentHash: { type: String, index: true },
    jobReadinessScore: { type: Number, default: 0 },
    analysisResult: { type: mongoose.Schema.Types.Mixed },

    // S3 storage
    s3Key: { type: String },  // e.g. "resumes/<userId>/<filename>"
    fileUrl: { type: String },  // public (or presigned) URL to the file on S3

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
