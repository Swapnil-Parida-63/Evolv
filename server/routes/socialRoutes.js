import express from 'express';
import multer from 'multer';
import path from 'path';
// AWS S3 imports removed — no longer using S3 for file storage
import { protect } from '../middleware/authMiddleware.js';
import SocialPost from '../models/SocialPost.js';

const router = express.Router();

// Memory storage: files processed in memory, stored as base64 data URLs
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Invalid file type'));
    }
});

// GET /api/social/feed - Paginated feed
router.get('/feed', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const posts = await SocialPost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'name avatar headline accountType')
            .populate('comments.author', 'name avatar');

        const total = await SocialPost.countDocuments();
        res.json({ posts, hasMore: skip + posts.length < total, page });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching feed' });
    }
});

// POST /api/social/post - Create post (text + up to 10 media files)
router.post('/post', protect, upload.array('media', 10), async (req, res) => {
    try {
        const { content, type, jobDetails } = req.body;
        // Convert uploaded files to base64 data URLs
        const media = (req.files || []).map(f => ({
            url: `data:${f.mimetype};base64,${f.buffer.toString('base64')}`,
            key: `${Date.now()}-${f.originalname}`,  // identifier only, no S3 key
            mimetype: f.mimetype
        }));

        const postData = {
            author: req.user._id,
            content: content || '',
            type: type || 'post',
            media
        };

        if (type === 'jobListing' && jobDetails) {
            postData.jobDetails = typeof jobDetails === 'string' ? JSON.parse(jobDetails) : jobDetails;
        }

        const post = await SocialPost.create(postData);
        await post.populate('author', 'name avatar headline accountType');
        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

// PUT /api/social/post/:id - Edit own post
router.put('/post/:id', protect, async (req, res) => {
    try {
        const post = await SocialPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { content, jobDetails } = req.body;
        if (content !== undefined) post.content = content;
        if (jobDetails) post.jobDetails = typeof jobDetails === 'string' ? JSON.parse(jobDetails) : jobDetails;
        post.updatedAt = new Date();
        await post.save();
        await post.populate('author', 'name avatar headline accountType');
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating post' });
    }
});

// DELETE /api/social/post/:id - Delete own post
router.delete('/post/:id', protect, async (req, res) => {
    try {
        const post = await SocialPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await post.deleteOne();
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting post' });
    }
});

// POST /api/social/post/:id/like - Toggle like
router.post('/post/:id/like', protect, async (req, res) => {
    try {
        const post = await SocialPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user._id.toString();
        const liked = post.likes.map(l => l.toString()).includes(userId);

        if (liked) {
            post.likes = post.likes.filter(l => l.toString() !== userId);
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json({ liked: !liked, likeCount: post.likes.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling like' });
    }
});

// POST /api/social/post/:id/comment - Add comment
router.post('/post/:id/comment', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

        const post = await SocialPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.comments.push({ author: req.user._id, text });
        await post.save();
        await post.populate('comments.author', 'name avatar');
        res.json(post.comments[post.comments.length - 1]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

// DELETE /api/social/post/:id/comment/:cid - Delete comment
router.delete('/post/:id/comment/:cid', protect, async (req, res) => {
    try {
        const post = await SocialPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(req.params.cid);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isOwner = comment.author.toString() === req.user._id.toString();
        const isPostOwner = post.author.toString() === req.user._id.toString();
        if (!isOwner && !isPostOwner) return res.status(403).json({ message: 'Unauthorized' });

        comment.deleteOne();
        await post.save();
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting comment' });
    }
});

// GET /api/social/profile/:userId - Get user posts
router.get('/profile/:userId', protect, async (req, res) => {
    try {
        const posts = await SocialPost.find({ author: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('author', 'name avatar headline accountType');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile posts' });
    }
});

export default router;
