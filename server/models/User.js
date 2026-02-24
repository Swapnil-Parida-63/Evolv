import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // Google OAuth fields
    googleId: { type: String, sparse: true },   // sparse = null is allowed + still unique
    authProvider: { type: String, default: 'local' }, // 'local' | 'google' | 'both'
    avatar: { type: String, default: '' },

    // Local auth — not required for Google-only users
    password: { type: String, required: false },

    createdAt: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['user', 'admin', 'evolv_admin'],
        default: 'user'
    },
    isNewAdmin: { type: Boolean, default: false },

    // Social / Hub profile fields
    accountType: {
        type: String,
        enum: ['student', 'developer', 'recruiter', 'company'],
        default: 'student'
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    headline: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    education: [{ school: String, degree: String, from: String, to: String }],
    links: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' }
    },
    lookingFor: { type: String, default: '' },
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt — skip for Google/OAuth users who have no password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
