import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Shield, User, Briefcase } from 'lucide-react';

// Google "G" SVG icon
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107" />
        <path d="M6.3 14.7l7 5.1C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7v1z" fill="#FF3D00" />
        <path d="M24 45c5.5 0 10.5-1.9 14.4-5.1l-6.7-5.5C29.8 36 27 37 24 37c-5.7 0-10.6-3.1-13.1-7.5L4 35c3.5 6.5 10.4 11 20 10z" fill="#4CAF50" />
        <path d="M44.5 20H24v8.5h11.8c-1.1 3.2-3.3 5.8-6.2 7.4l6.7 5.5C40.7 37.3 45 31.3 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2" />
    </svg>
);

const Input = ({ type, placeholder, value, onChange, required }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
            padding: '12px 16px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box',
            transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(212,255,0,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
    />
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isDevMode, setIsDevMode] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Show error if Google OAuth failed
    useEffect(() => {
        if (searchParams.get('error') === 'google_failed') {
            setError('Google sign-in failed. Please try again or use email/password.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    const handleGoogle = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`;
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#0f0f0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', position: 'relative'
        }}>
            {/* Dev Mode Toggle */}
            <div style={{ position: 'absolute', top: '20px', right: '40px' }}>
                <button
                    onClick={() => setIsDevMode(!isDevMode)}
                    style={{
                        background: 'transparent', border: '1px solid #333',
                        color: isDevMode ? '#d4ff00' : '#666',
                        padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    {isDevMode ? <Briefcase size={14} /> : <User size={14} />}
                    {isDevMode ? 'Employee Mode' : 'User Mode'}
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '380px', padding: '0 20px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontWeight: '800', fontSize: '32px', color: '#fff', letterSpacing: '-1.5px' }}>
                        Evolv
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '6px' }}>
                        {isDevMode ? 'Employee Portal' : 'Sign in to your account'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        color: '#ff6b6b', background: 'rgba(255,60,60,0.1)',
                        border: '1px solid rgba(255,60,60,0.2)',
                        padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', padding: '28px'
                }}>
                    {/* Google Sign In — not shown in Dev Mode */}
                    {!isDevMode && (
                        <>
                            <button
                                onClick={handleGoogle}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '10px',
                                    background: '#fff', color: '#1f1f1f',
                                    border: 'none', borderRadius: '10px',
                                    padding: '11px 16px', fontSize: '14px', fontWeight: '600',
                                    cursor: 'pointer', transition: 'opacity 0.15s'
                                }}
                                onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                                onMouseOut={e => e.currentTarget.style.opacity = '1'}
                            >
                                <GoogleIcon /> Continue with Google
                            </button>

                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                margin: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: '12px'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                or sign in with email
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Input
                            type="email"
                            placeholder={isDevMode ? 'evolv_username@evolv.com' : 'Email address'}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            style={{
                                marginTop: '4px', padding: '12px', borderRadius: '10px',
                                border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '15px',
                                background: isDevMode ? '#d4ff00' : 'rgba(212,255,0,0.9)',
                                color: '#000', transition: 'opacity 0.15s'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                            {isDevMode ? 'Access Portal' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {!isDevMode && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: '#d4ff00', textDecoration: 'none', fontWeight: '600' }}>
                            Sign up
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
