import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import postRoutes from './routes/postRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';

import passport from './config/passport.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Session needed for passport OAuth flow only (not for JWT auth)
app.use(session({
    secret: process.env.JWT_SECRET || 'evolv_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true in production with HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api', (req, res) => res.json({ status: 'Evolv API is running' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Profile & Avatar routes ───────────────────────────────────────────────────
// Avatar upload → memory storage, saved as base64 data URL in MongoDB
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

app.put('/api/auth/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { headline, bio, skills, education, links, lookingFor, accountType } = req.body;
        if (headline !== undefined) user.headline = headline;
        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined) user.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
        if (education !== undefined) user.education = typeof education === 'string' ? JSON.parse(education) : education;
        if (links !== undefined) user.links = typeof links === 'string' ? JSON.parse(links) : links;
        if (lookingFor !== undefined) user.lookingFor = lookingFor;
        if (accountType !== undefined) user.accountType = accountType;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.post('/api/auth/avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (req.file) {
            // Convert uploaded file to base64 data URL and store in MongoDB
            const base64 = req.file.buffer.toString('base64');
            const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
            user.avatar = dataUrl;
            await user.save();
        }
        res.json({ avatar: user.avatar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading avatar' });
    }
});

// ─── Serve React build in production ─────────────────────────────────────────
// In Vercel, the client is served separately — this is for local dev fallback
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDist));
    // SPA fallback — send index.html for any non-API route
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientDist, 'index.html'));
        }
    });
} else {
    // Dev-only health check
    app.get('/', (req, res) => res.send('Evolv API is running...'));
}


// ─── Seed Evolv Admin ─────────────────────────────────────────────────────────
const seedAdmin = async () => {
    try {
        const adminEmail = 'evolv@admin.com';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                name: 'Evolv Admin',
                email: adminEmail,
                password: 'adminpassword123',
                role: 'evolv_admin'
            });
            console.log('Evolv Admin seeded');
        }
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

// ─── MongoDB Connection ───────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('MongoDB Connected');
            seedAdmin();
        })
        .catch(err => console.error('MongoDB Connection Error:', err));
} else {
    console.warn('MONGO_URI not found in environment variables');
}

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
