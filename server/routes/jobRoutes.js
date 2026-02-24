import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import SocialPost from '../models/SocialPost.js';
import JobApplication from '../models/JobApplication.js';
import { generateJobSuggestions, summarizeApplicant } from '../services/aiService.js';

const router = express.Router();

// Multer for resume uploads
const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/resumes/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `resume-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
});
const resumeUpload = multer({ storage: resumeStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/jobs/listings - Company job listings from DB (paginated)
router.get('/listings', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const listings = await SocialPost.find({ type: 'jobListing' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'name avatar headline');

        const total = await SocialPost.countDocuments({ type: 'jobListing' });
        res.json({ listings, hasMore: skip + listings.length < total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

// GET /api/jobs/ai-suggestions - AI-generated job suggestions
router.get('/ai-suggestions', protect, async (req, res) => {
    try {
        const { q } = req.query;
        const userSkills = req.user.skills || [];
        const jobs = await generateJobSuggestions(q, userSkills);
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating job suggestions' });
    }
});

// POST /api/jobs/apply - Apply to a job listing
router.post('/apply', protect, resumeUpload.single('resume'), async (req, res) => {
    try {
        const { jobId, coverLetter, customAnswers } = req.body;

        const job = await SocialPost.findById(jobId);
        if (!job || job.type !== 'jobListing') return res.status(404).json({ message: 'Job not found' });

        // Check already applied
        const existing = await JobApplication.findOne({ job: jobId, applicant: req.user._id });
        if (existing) return res.status(400).json({ message: 'Already applied to this job' });

        const application = await JobApplication.create({
            job: jobId,
            applicant: req.user._id,
            resume: req.file ? `/uploads/resumes/${req.file.filename}` : null,
            coverLetter: coverLetter || '',
            customAnswers: customAnswers ? JSON.parse(customAnswers) : []
        });

        res.status(201).json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting application' });
    }
});

// GET /api/jobs/my-applications - Student: get all their applications
router.get('/my-applications', protect, async (req, res) => {
    try {
        const applications = await JobApplication.find({ applicant: req.user._id })
            .populate({
                path: 'job',
                select: 'jobDetails author createdAt',
                populate: { path: 'author', select: 'name avatar' }
            })
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// DELETE /api/jobs/application/:id - Student: delete application
router.delete('/application/:id', protect, async (req, res) => {
    try {
        const app = await JobApplication.findById(req.params.id);
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.applicant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await app.deleteOne();
        res.json({ message: 'Application withdrawn' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting application' });
    }
});

// GET /api/jobs/recruiter/openings - Recruiter: get their job openings
router.get('/recruiter/openings', protect, async (req, res) => {
    try {
        const openings = await SocialPost.find({ author: req.user._id, type: 'jobListing' })
            .sort({ createdAt: -1 });
        res.json(openings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching openings' });
    }
});

// GET /api/jobs/recruiter/applications/:jobId - Applications per opening
router.get('/recruiter/applications/:jobId', protect, async (req, res) => {
    try {
        const job = await SocialPost.findById(req.params.jobId);
        if (!job || job.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const applications = await JobApplication.find({ job: req.params.jobId })
            .populate('applicant', 'name avatar email headline skills education links accountType')
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// GET /api/jobs/recruiter/application/:id - Full application detail
router.get('/recruiter/application/:id', protect, async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id)
            .populate('applicant', 'name avatar email headline bio skills education links lookingFor accountType')
            .populate({ path: 'job', select: 'jobDetails author', populate: { path: 'author', select: 'name' } });

        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Ensure the recruiter owns the job
        if (application.job.author._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching application' });
    }
});

// POST /api/jobs/recruiter/application/:id/summary - AI summarize applicant
router.post('/recruiter/application/:id/summary', protect, async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id)
            .populate('applicant', 'name skills education')
            .populate({ path: 'job', select: 'jobDetails author', populate: { path: 'author', select: 'name' } });

        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.job.author._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Return cached summary if available
        if (application.aiSummary) {
            return res.json(JSON.parse(application.aiSummary));
        }

        // Generate new summary
        const summary = await summarizeApplicant({
            jobTitle: application.job.jobDetails?.title || 'Unknown Role',
            applicantName: application.applicant.name,
            resumeText: req.body.resumeText || '', // Resume text passed from frontend
            coverLetter: application.coverLetter,
            customAnswers: application.customAnswers
        });

        // Cache it
        application.aiSummary = JSON.stringify(summary);
        await application.save();

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating AI summary' });
    }
});

// PUT /api/jobs/recruiter/application/:id/status - Update application status
router.put('/recruiter/application/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const application = await JobApplication.findById(req.params.id)
            .populate({ path: 'job', select: 'author' });

        if (!application) return res.status(404).json({ message: 'Not found' });
        if (application.job.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        application.status = status;
        await application.save();
        res.json({ status: application.status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

// GET /api/jobs/company/:userId - Get job listings posted by a specific user (company/recruiter profile)
router.get('/company/:userId', protect, async (req, res) => {
    try {
        const listings = await SocialPost.find({ author: req.params.userId, type: 'jobListing' })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('author', 'name avatar headline');
        // Map to a cleaner shape for the profile page
        const jobs = listings.map(l => ({
            _id: l._id,
            title: l.jobDetails?.title || '',
            location: l.jobDetails?.location || '',
            type: l.jobDetails?.jobType || '',
            salary: l.jobDetails?.salary || '',
            description: l.content || '',
            company: l.jobDetails?.company || l.author?.name || '',
            createdAt: l.createdAt,
        }));
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching company jobs' });
    }
});

export default router;

