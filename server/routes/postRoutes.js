import express from 'express';
import Post from '../models/Post.js';
import { optimizeLinkedInPost, createLinkedInPost } from '../services/aiService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Optimize existing content
router.post('/optimize', protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Content is required' });

        const analysis = await optimizeLinkedInPost(content);

        const newPost = await Post.create({
            user: req.user._id,
            originalContent: content,
            analysis: analysis,
            type: 'optimize'
        });

        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'POST_OPTIMIZE',
            details: { snippet: content.substring(0, 50) + '...' },
            ip: req.ip
        });

        res.json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error optimizing post' });
    }
});

// Create post from scratch
router.post('/create', protect, async (req, res) => {
    try {
        const { topic, keyPoints } = req.body;
        if (!topic) return res.status(400).json({ message: 'Topic is required' });

        const generated = await createLinkedInPost(topic, keyPoints);

        // For "create", we treat the generated content as the "optimized" version immediately
        // but we might want to store it as "original" if the user wants to refine it later.
        // For simplicity, we store the generated content as a rewrite.

        const newPost = await Post.create({
            user: req.user._id,
            originalContent: `Topic: ${topic}\nPoints: ${keyPoints}`,
            optimizedRewrites: {
                viral_storytelling: generated.post_content
            },
            type: 'scratch'
        });

        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'POST_CREATE',
            details: { topic },
            ip: req.ip
        });

        res.json({ ...newPost.toObject(), generated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

// Get user's recent posts (active only)
router.get('/', protect, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

export default router;
