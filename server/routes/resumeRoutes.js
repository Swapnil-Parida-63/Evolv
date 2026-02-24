import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET } from '../config/s3.js';
import Resume from '../models/Resume.js';
import ActivityLog from '../models/ActivityLog.js';
import { extractText } from '../utils/extractText.js';
import { analyzeResume } from '../services/aiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Use memory storage so we can extract text from the buffer,
// then manually push the file to S3.
const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|docx|txt/;
        if (allowed.test(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
        }
    }
});

// Helper — push a buffer to S3 and return the public URL + key
const uploadBufferToS3 = async (buffer, mimetype, originalName, userId) => {
    const key = `resumes/${userId}/${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
    }));
    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { key, url };
};

// ─── POST /api/resume/upload ─────────────────────────────────────────────────
router.post('/upload', protect, resumeUpload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        // 1. Extract text from buffer (works for PDF, DOCX, TXT)
        const text = await extractText(req.file);

        // 2. Deduplication hash
        const hash = crypto.createHash('md5').update(text).digest('hex');

        // 3. Check cache for this user
        const existing = await Resume.findOne({ contentHash: hash, user: req.user._id });
        if (existing) {
            const response = existing.toObject();
            delete response.analysisResult;
            delete response.jobReadinessScore;
            return res.json(response);
        }

        // 4. Upload to S3
        const { key, url } = await uploadBufferToS3(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            req.user._id
        );

        // 5. Save to MongoDB
        const newResume = new Resume({
            user: req.user._id,
            originalName: req.file.originalname,
            resumeText: text,
            contentHash: hash,
            s3Key: key,
            fileUrl: url,
        });
        await newResume.save();

        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'RESUME_UPLOAD',
            details: { fileName: req.file.originalname, s3Key: key },
            ip: req.ip
        });

        res.json(newResume);
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ message: 'Error processing resume' });
    }
});

// ─── POST /api/resume/analyze ─────────────────────────────────────────────────
router.post('/analyze', protect, async (req, res) => {
    try {
        const { resumeId } = req.body;
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });
        if (!resume.resumeText) return res.status(400).json({ message: 'Resume text missing.' });

        const aiResults = await analyzeResume(resume.resumeText);
        resume.jobReadinessScore = aiResults.readinessScore;
        resume.analysisResult = aiResults;

        if (aiResults.upskillingRoadmap) {
            resume.roadmapProgress = aiResults.upskillingRoadmap.map(item => ({
                skill: item.skill,
                description: item.description,
                timeline: item.timeline,
                priority: item.priority,
                microSteps: item.microSteps.map(step => ({ step, isCompleted: false })),
                isCompleted: false
            }));
        }

        resume.markModified('analysisResult');
        await resume.save();
        res.json(resume);
    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ message: 'AI Analysis Failed', error: error.message });
    }
});

// ─── PUT /api/resume/:id/roadmap ──────────────────────────────────────────────
router.put('/:id/roadmap', protect, async (req, res) => {
    try {
        const { skill, step } = req.body;
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });

        const roadmapItem = resume.roadmapProgress.find(i => i.skill === skill);
        if (roadmapItem) {
            const microStep = roadmapItem.microSteps.find(s => s.step === step);
            if (microStep) microStep.isCompleted = !microStep.isCompleted;
            roadmapItem.isCompleted = roadmapItem.microSteps.every(s => s.isCompleted);
        }

        await resume.save();
        res.json(resume.roadmapProgress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating roadmap' });
    }
});

// ─── POST /api/resume/refresh-jobs ───────────────────────────────────────────
router.post('/refresh-jobs', protect, async (req, res) => {
    try {
        const { resumeId } = req.body;
        const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });
        if (!resume.resumeText) return res.status(400).json({ message: 'Resume text not found. Please re-upload.' });

        const { refreshOpportunities } = await import('../services/aiService.js');
        const newJobs = await refreshOpportunities(resume.resumeText);
        resume.analysisResult.suggestedOpportunities = newJobs.suggestedOpportunities;
        resume.markModified('analysisResult');
        await resume.save();
        res.json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error refreshing jobs' });
    }
});

// ─── GET /api/resume ──────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user._id }).sort({ uploadDate: -1 });
        res.json(resumes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resumes' });
    }
});

// ─── DELETE /api/resume/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });

        // Delete from S3 if a key exists
        if (resume.s3Key) {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: resume.s3Key }))
                .catch(err => console.error('S3 delete failed (non-fatal):', err));
        }

        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'RESUME_DELETE',
            details: { resumeId: req.params.id, originalName: resume.originalName },
            ip: req.ip
        });

        res.json({ message: 'Resume removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting resume' });
    }
});

export default router;
