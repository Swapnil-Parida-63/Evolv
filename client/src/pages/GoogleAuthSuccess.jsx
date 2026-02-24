import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Landing page for /auth/google/success
 * The server redirects here after a successful Google login,
 * passing the full user payload + JWT as a URL query param.
 * We read it, store in localStorage/context, then redirect to the app.
 */
const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const raw = searchParams.get('user');
        if (!raw) {
            navigate('/login?error=google_failed');
            return;
        }

        try {
            const userData = JSON.parse(decodeURIComponent(raw));
            const { token, ...userInfo } = userData;

            // Store in localStorage (same format as email/password login)
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ ...userInfo, token }));

            // Push into React context
            setUser({ ...userInfo, token });

            navigate('/dashboard');
        } catch {
            navigate('/login?error=google_failed');
        }
    }, []);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', flexDirection: 'column', gap: '16px', color: '#fff'
        }}>
            <div style={{
                width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.15)',
                borderTop: '3px solid #d4ff00', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Signing you in with Google…</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default GoogleAuthSuccess;
