import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    const { name, email, password, accountType } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            accountType: accountType || 'student'
        });

        if (user) {
            await ActivityLog.create({
                user: user._id,
                userName: user.name,
                action: 'SIGNUP',
                ip: req.ip
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountType: user.accountType,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            await ActivityLog.create({
                user: user._id,
                userName: user.name,
                action: 'LOGIN',
                ip: req.ip
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isNewAdmin: user.isNewAdmin,
                accountType: user.accountType,
                headline: user.headline,
                bio: user.bio,
                skills: user.skills,
                education: user.education,
                links: user.links,
                avatar: user.avatar,
                lookingFor: user.lookingFor,
                followers: user.followers,
                following: user.following,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
// router.get('/me', protect, async (req, res) => {
//     const user = await User.findById(req.user._id);
//     if (user) {
//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//         });
//     } else {
//         res.status(404).json({ message: 'User not found' });
//     }
// });


// @desc    Logout user & log event
// @route   POST /api/auth/logout
// @access  Private

router.post('/logout', protect, async (req, res) => {
    try {
        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'LOGOUT',
            ip: req.ip
        });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging out' });
    }
});

// @desc    Update user profile fields (name, headline, bio, etc.)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, headline, bio } = req.body;
        const user = await (await import('../models/User.js')).default.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (name) user.name = name.trim();
        if (headline !== undefined) user.headline = headline;
        if (bio !== undefined) user.bio = bio;
        await user.save();
        res.json({ name: user.name, headline: user.headline, bio: user.bio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1 — redirect user to Google consent screen
// GET /api/auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));

// Step 2 — Google redirects back here with a code
// GET /api/auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Log the event
            await ActivityLog.create({
                user: user._id,
                userName: user.name,
                action: 'GOOGLE_LOGIN',
                ip: req.ip
            }).catch(() => { }); // non-fatal

            // Redirect to frontend — token passed in query param
            // Frontend reads it from URL, stores in localStorage
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const userPayload = encodeURIComponent(JSON.stringify({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountType: user.accountType,
                avatar: user.avatar,
                headline: user.headline,
                bio: user.bio,
                skills: user.skills,
                education: user.education,
                links: user.links,
                lookingFor: user.lookingFor,
                followers: user.followers,
                following: user.following,
                authProvider: user.authProvider,
                token,
            }));
            res.redirect(`${clientUrl}/auth/google/success?user=${userPayload}`);
        } catch (err) {
            console.error('Google callback error:', err);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`);
        }
    }
);

export default router;
