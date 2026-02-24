import express from 'express';
import { chatWithAI } from '../services/aiService.js';
import { protect } from '../middleware/authMiddleware.js';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// Get recent sessions history
router.get('/history', protect, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ user: req.user._id })
            .select('messages lastActivity isSaved')
            .sort({ lastActivity: -1 })
            .limit(20);

        // Format for list view (snippet, date)
        const historyList = sessions.map(s => ({
            _id: s._id,
            snippet: s.messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'New Chat',
            lastActivity: s.lastActivity,
            isSaved: s.isSaved
        }));

        res.json(historyList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching history' });
    }
});

// Create NEW session explicitly
router.post('/session', protect, async (req, res) => {
    try {
        const session = await ChatSession.create({
            user: req.user._id,
            messages: [{ role: 'system', content: "You are Evolv AI, a helpful and intelligent career assistant. You help users with career advice, resume tips, and general professional guidance. Keep your answers concise and professional." }]
        });
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating session' });
    }
});

// Get specific session
router.get('/:id', protect, async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching session' });
    }
});

// Get active session (optional fallback)
router.get('/', protect, async (req, res) => {
    try {
        // Find the most recent active session for this user
        let session = await ChatSession.findOne({ user: req.user._id }).sort({ lastActivity: -1 });

        if (!session) {
            session = await ChatSession.create({
                user: req.user._id,
                messages: [{ role: 'system', content: "You are Evolv AI, a helpful and intelligent career assistant. You help users with career advice, resume tips, and general professional guidance. Keep your answers concise and professional." }]
            });
        }
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching chat session' });
    }
});

// Toggle Permanent Save
router.put('/save', protect, async (req, res) => {
    try {
        const { sessionId, isSaved } = req.body;
        const session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });

        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.isSaved = isSaved;
        await session.save();

        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating save status' });
    }
});

// Send Message
router.post('/', protect, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
        }

        // Create new if not found
        if (!session) {
            session = await ChatSession.create({
                user: req.user._id,
                messages: [{ role: 'system', content: "You are Evolv AI, a helpful and intelligent career assistant. You help users with career advice, resume tips, and general professional guidance. Keep your answers concise and professional." }]
            });
        }

        // Add User Message
        session.messages.push({ role: 'user', content: message });

        // Prepare history for AI (map to pure objects)
        const history = session.messages.map(m => ({ role: m.role, content: m.content }));

        // Get AI Response (using the service function but passing pure history)
        // We modify chatWithAI signature slightly in service or just pass history here
        // The service function expects (message, history). 
        // Since we already added the message to history, let's pass the LAST message as 'message' 
        // and the REST as history.

        // Actually, let's reuse the existing service logic but we need to match arguments.
        // chatWithAI(message, history) appends the message to history.
        // So we should pass stored history WITHOUT the new message, and pass the new message separately.

        const historyForAI = session.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

        const aiResponseContent = await chatWithAI(message, historyForAI);

        // Add AI Message
        session.messages.push({ role: 'assistant', content: aiResponseContent });
        session.lastActivity = new Date();
        await session.save();

        res.json({ response: aiResponseContent, session });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error in chat' });
    }
});

export default router;
