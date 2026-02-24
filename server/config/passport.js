import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // We deliberately do NOT store accessToken or refreshToken
      try {
        const googleEmail = profile.emails?.[0]?.value;
        const googleAvatar = profile.photos?.[0]?.value;

        // 1. Check if a user already exists with this googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Already linked — just return
          return done(null, user);
        }

        // 2. Check if a user with the same email exists (email/password account)
        //    → link Google to that existing account (no duplicate)
        user = await User.findOne({ email: googleEmail });

        if (user) {
          user.googleId = profile.id;
          user.authProvider = user.authProvider === 'local' ? 'both' : 'google';
          if (!user.avatar && googleAvatar) user.avatar = googleAvatar;
          await user.save();
          return done(null, user);
        }

        // 3. Brand new user — create one
        user = await User.create({
          googleId: profile.id,
          email: googleEmail,
          name: profile.displayName,
          avatar: googleAvatar || '',
          authProvider: 'google',
          // password intentionally omitted (Google users have no local password)
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We don't use sessions for user state (we use JWT), but passport still needs these
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;