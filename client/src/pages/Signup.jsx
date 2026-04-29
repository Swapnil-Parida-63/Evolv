import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ACCOUNT_TYPES = [
    { id: 'student', emoji: '🎓', label: 'Student', desc: 'Looking for jobs & internships' },
    { id: 'developer', emoji: '👨‍💻', label: 'Developer', desc: 'Showcasing projects & skills' },
    { id: 'recruiter', emoji: '🔍', label: 'Recruiter', desc: 'Hiring individuals' },
    { id: 'company', emoji: '🏢', label: 'Company', desc: 'Posting jobs & company updates' },
];

const Signup = () => {
    const [step, setStep] = useState(1); // 1 = account type, 2 = form
    const [accountType, setAccountType] = useState('student');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signup(name, email, password, accountType);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Signup failed');
        }
        setLoading(false);
    };

    const base = {
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif'
    };

    return (
        <div style={base}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-2px' }}>
                        Evolv<span style={{ color: '#d4ff00' }}>.</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '6px' }}>
                        Your career growth platform
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px'
                }}>
                    {step === 1 ? (
                        <>
                            <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '22px', marginBottom: '6px', textAlign: 'center' }}>
                                I am a…
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                                This helps us personalise your experience
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {ACCOUNT_TYPES.map(({ id, emoji, label, desc }) => (
                                    <button
                                        key={id}
                                        onClick={() => setAccountType(id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '14px 18px', borderRadius: '14px',
                                            border: `2px solid ${accountType === id ? '#d4ff00' : 'rgba(255,255,255,0.08)'}`,
                                            background: accountType === id ? 'rgba(212,255,0,0.08)' : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                                        }}
                                    >
                                        <span style={{ fontSize: '28px' }}>{emoji}</span>
                                        <div>
                                            <div style={{ color: accountType === id ? '#d4ff00' : '#fff', fontWeight: '700', fontSize: '15px' }}>{label}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{desc}</div>
                                        </div>
                                        {accountType === id && (
                                            <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', background: '#d4ff00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ color: '#000', fontSize: '12px', fontWeight: '800' }}>✓</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(2)} style={{
                                width: '100%', marginTop: '20px', padding: '14px',
                                background: '#d4ff00', color: '#000', border: 'none',
                                borderRadius: '12px', fontWeight: '800', fontSize: '15px',
                                cursor: 'pointer', letterSpacing: '0.3px'
                            }}>
                                Continue as {ACCOUNT_TYPES.find(t => t.id === accountType)?.label} →
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} style={{
                                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0, display: 'flex', alignItems: 'center', gap: '5px'
                            }}>← Back</button>
                            <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '22px', marginBottom: '24px' }}>
                                Create your account
                            </h2>
                            {error && (
                                <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#ff8080', fontSize: '13px', marginBottom: '16px' }}>
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', display: 'block' }}>
                                        {accountType === 'company' ? 'Company Name' : 'Full Name'}
                                    </label>
                                    <input
                                        type="text" value={name} onChange={e => setName(e.target.value)} required
                                        placeholder={accountType === 'company' ? 'Acme Corp' : 'Your full name'}
                                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', display: 'block' }}>Email</label>
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                        placeholder="you@example.com"
                                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', display: 'block' }}>Password</label>
                                    <input
                                        type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                                        placeholder="Min. 6 characters"
                                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '14px', background: '#d4ff00', color: '#000',
                                    border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px',
                                    cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px'
                                }}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                or
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            {/* Google Sign Up */}
                            <button
                                onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`; }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '10px',
                                    background: '#fff', color: '#1f1f1f',
                                    border: 'none', borderRadius: '12px',
                                    padding: '12px 16px', fontSize: '14px', fontWeight: '600',
                                    cursor: 'pointer', transition: 'opacity 0.15s'
                                }}
                                onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                                onMouseOut={e => e.currentTarget.style.opacity = '1'}
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107" />
                                    <path d="M6.3 14.7l7 5.1C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7v1z" fill="#FF3D00" />
                                    <path d="M24 45c5.5 0 10.5-1.9 14.4-5.1l-6.7-5.5C29.8 36 27 37 24 37c-5.7 0-10.6-3.1-13.1-7.5L4 35c3.5 6.5 10.4 11 20 10z" fill="#4CAF50" />
                                    <path d="M44.5 20H24v8.5h11.8c-1.1 3.2-3.3 5.8-6.2 7.4l6.7 5.5C40.7 37.3 45 31.3 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2" />
                                </svg>
                                Continue with Google
                            </button>
                        </>
                    )}

                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
                        Already have an account? <Link to="/login" style={{ color: '#d4ff00', fontWeight: '600' }}>Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
