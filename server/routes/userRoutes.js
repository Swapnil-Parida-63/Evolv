import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const router = express.Router();

// ─── FOLLOW / UNFOLLOW ────────────────────────────────────────────────────────

// POST /api/users/:id/follow  — toggle follow
router.post('/:id/follow', protect, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: "You can't follow yourself" });
        }
        const target = await User.findById(req.params.id);
        const me = await User.findById(req.user._id);
        if (!target || !me) return res.status(404).json({ message: 'User not found' });

        const alreadyFollowing = me.following.map(id => id.toString()).includes(req.params.id);

        if (alreadyFollowing) {
            // Unfollow
            me.following = me.following.filter(id => id.toString() !== req.params.id);
            target.followers = target.followers.filter(id => id.toString() !== req.user._id.toString());
        } else {
            // Follow
            me.following.push(target._id);
            target.followers.push(me._id);
        }
        await me.save();
        await target.save();

        res.json({
            following: !alreadyFollowing,
            followerCount: target.followers.length,
            followingCount: me.following.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error toggling follow' });
    }
});

// GET /api/users/:id — get public profile
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', 'name avatar headline accountType')
            .populate('following', 'name avatar headline accountType');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isFollowing = user.followers.map(f => f._id.toString()).includes(req.user._id.toString());
        res.json({ ...user.toObject(), isFollowing });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// GET /api/users/search?q=  — search users
router.get('/search/people', protect, async (req, res) => {
    try {
        const q = req.query.q || '';
        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { headline: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        }).select('name avatar headline accountType followers following').limit(20);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error searching users' });
    }
});

// ─── DIRECT MESSAGES ──────────────────────────────────────────────────────────

// GET /api/users/conversations — list all conversations for current user
router.get('/dm/conversations', protect, async (req, res) => {
    try {
        const convos = await Conversation.find({ participants: req.user._id })
            .sort({ updatedAt: -1 })
            .populate('participants', 'name avatar headline accountType')
            .populate('lastMessage');
        res.json(convos);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching conversations' });
    }
});

// POST /api/users/dm/:userId — get or create conversation with a user
router.post('/dm/:userId', protect, async (req, res) => {
    try {
        const me = req.user._id;
        const other = req.params.userId;

        // Find existing conversation between exactly these two people
        let convo = await Conversation.findOne({
            participants: { $all: [me, other], $size: 2 }
        }).populate('participants', 'name avatar headline accountType');

        if (!convo) {
            convo = await Conversation.create({ participants: [me, other] });
            convo = await Conversation.findById(convo._id)
                .populate('participants', 'name avatar headline accountType');
        }
        res.json(convo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error getting/creating conversation' });
    }
});

// GET /api/users/dm/:convoId/messages — get messages in a conversation
router.get('/dm/:convoId/messages', protect, async (req, res) => {
    try {
        const convo = await Conversation.findById(req.params.convoId);
        if (!convo) return res.status(404).json({ message: 'Conversation not found' });
        if (!convo.participants.map(p => p.toString()).includes(req.user._id.toString())) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const messages = await Message.find({ conversation: req.params.convoId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name avatar');

        // Mark messages as read
        await Message.updateMany(
            { conversation: req.params.convoId, sender: { $ne: req.user._id }, read: false },
            { $set: { read: true } }
        );

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// POST /api/users/dm/:convoId/messages — send a message
router.post('/dm/:convoId/messages', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

        const convo = await Conversation.findById(req.params.convoId);
        if (!convo) return res.status(404).json({ message: 'Conversation not found' });
        if (!convo.participants.map(p => p.toString()).includes(req.user._id.toString())) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const msg = await Message.create({
            conversation: convo._id,
            sender: req.user._id,
            text: text.trim()
        });

        convo.lastMessage = msg._id;
        convo.updatedAt = new Date();
        await convo.save();

        await msg.populate('sender', 'name avatar');
        res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// GET /api/users/dm/unread-count — get total unread message count
router.get('/dm/unread-count', protect, async (req, res) => {
    try {
        const myConvos = await Conversation.find({ participants: req.user._id }).select('_id');
        const convoIds = myConvos.map(c => c._id);
        const count = await Message.countDocuments({
            conversation: { $in: convoIds },
            sender: { $ne: req.user._id },
            read: false
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/dm/message/:msgId — edit a message (sender only)
router.put('/dm/message/:msgId', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Text required' });
        const msg = await Message.findById(req.params.msgId).populate('sender', 'name avatar');
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        if (msg.sender._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your message' });
        }
        msg.text = text.trim();
        msg.edited = true;
        await msg.save();
        res.json(msg);
    } catch (err) {
        res.status(500).json({ message: 'Error editing message' });
    }
});

// DELETE /api/users/dm/message/:msgId — delete a message (sender only)
router.delete('/dm/message/:msgId', protect, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.msgId);
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        if (msg.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your message' });
        }
        await msg.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting message' });
    }
});

export default router;

