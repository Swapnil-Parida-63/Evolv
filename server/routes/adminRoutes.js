import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Resume from '../models/Resume.js';
import Post from '../models/Post.js';
import { protect, admin, evolvAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all activity logs
// @route   GET /api/admin/logs
// @access  Admin, Evolv Admin
router.get('/logs', protect, admin, async (req, res) => {
    try {
        const pageSize = 50;
        const page = Number(req.query.page) || 1;

        const count = await ActivityLog.countDocuments({});
        const logs = await ActivityLog.find({})
            .sort({ timestamp: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ logs, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin, Evolv Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// @desc    Promote user to Admin
// @route   PUT /api/admin/promote
// @access  Evolv Admin
router.put('/promote', protect, evolvAdmin, async (req, res) => {
    const { email } = req.body;

    // 1. Enforce Employee Email Restriction
    if (!email.startsWith('evolv_')) {
        return res.status(400).json({ message: 'Only employees (evolv_*) can be promoted to Admin.' });
    }

    try {
        const user = await User.findOne({ email });
        if (user) {
            user.role = 'admin';
            user.isNewAdmin = true;
            await user.save();

            // Log action
            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name,
                action: 'PROMOTE_ADMIN',
                details: { targetUser: user.email }
            });

            res.json({ message: `User ${user.name} promoted to Admin` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error promoting user' });
    }
});

// @desc    Create Employee Account
// @route   POST /api/admin/create-employee
// @access  Evolv Admin
router.post('/create-employee', protect, evolvAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        // Generate credentials
        const cleanName = name.toLowerCase().replace(/\s+/g, '');
        const email = `evolv_${cleanName}@evolv.com`;
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8); // Random secure-ish password

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: `Employee ${email} already exists` });

        const user = await User.create({
            name: name,
            email: email,
            password: password,
            role: 'user' // Default to user, Admin promotes specific ones
        });

        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'CREATE_EMPLOYEE',
            details: { newEmployee: email }
        });

        res.status(201).json({ email, password });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating employee' });
    }
});

// @desc    Demote Admin to User
// @route   PUT /api/admin/demote
// @access  Evolv Admin
router.put('/demote', protect, evolvAdmin, async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            if (user.role === 'evolv_admin') {
                return res.status(400).json({ message: 'Cannot demote Evolv Admin' });
            }
            user.role = 'user';
            user.isNewAdmin = false;
            await user.save();

            await ActivityLog.create({
                user: req.user._id,
                userName: req.user.name,
                action: 'DEMOTE_ADMIN',
                details: { targetUser: user.email }
            });

            res.json({ message: `User ${user.name} demoted to User` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error demoting user' });
    }
});

// @desc    Permanently Delete User & All Data
// @route   DELETE /api/admin/user/:id
// @access  Evolv Admin
router.delete('/user/:id', protect, evolvAdmin, async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.role === 'evolv_admin') {
            return res.status(400).json({ message: 'Cannot delete Evolv Admin' });
        }

        // 1. Delete all related data
        await Resume.deleteMany({ user: userToDelete._id });
        await Post.deleteMany({ user: userToDelete._id });
        await ActivityLog.deleteMany({ user: userToDelete._id }); // Wipe their logs too? Yes, "no traces found"

        // 2. Delete the user
        await User.findByIdAndDelete(userToDelete._id);

        // 3. Log the action (by the admin, not the deleted user)
        await ActivityLog.create({
            user: req.user._id,
            userName: req.user.name,
            action: 'DELETE_USER_FULL',
            details: { deletedUserEmail: userToDelete.email, deletedUserId: userToDelete._id }
        });

        res.json({ message: `User ${userToDelete.email} and all data permanently deleted.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// @desc    Acknowledge promotion notification
// @route   POST /api/admin/ack-promotion
// @access  Private
router.post('/ack-promotion', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.isNewAdmin = false;
            await user.save();
            res.json({ message: 'Promotion acknowledged' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

export default router;
