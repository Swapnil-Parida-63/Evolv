import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: String }, // file path to uploaded resume
    coverLetter: { type: String, default: '' },
    customAnswers: [{ label: String, answer: String }],
    aiSummary: { type: String, default: null }, // cached AI summary
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
        default: 'pending'
    },
    appliedAt: { type: Date, default: Date.now }
});

// Prevent duplicate applications
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
