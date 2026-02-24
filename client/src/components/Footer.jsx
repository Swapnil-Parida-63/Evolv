import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Github, Twitter, Linkedin, FileText, Briefcase, Sparkles } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Footer = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const linkStyle = {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        textDecoration: 'none',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        padding: 0,
        transition: 'color 0.15s',
        display: 'inline',
        lineHeight: '1.8'
    };

    const handleLinkHover = (e, enter) => {
        e.currentTarget.style.color = enter ? '#d4ff00' : 'rgba(255,255,255,0.4)';
    };

    const quickLinks = [
        { label: 'Resume AI', action: () => navigate('/dashboard') },
        { label: 'Evolv Hub', action: () => navigate('/hub') },
        { label: 'My Profile', action: () => navigate('/profile') },
    ];

    const legalLinks = [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ];

    return (
        <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            marginTop: '48px',
            padding: '40px 40px 28px',
            background: 'rgba(0,0,0,0.2)',
        }}>
            {/* Top row */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '40px', marginBottom: '36px' }}>

                {/* Brand */}
                <div>
                    <div style={{ fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-1px', marginBottom: '10px' }}>
                        Evolv
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                        AI-powered career growth for students &amp; developers. Build your resume, explore jobs, and connect with recruiters.
                    </p>
                    {/* Social icons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {[
                            { icon: Github, href: 'https://github.com' },
                            { icon: Twitter, href: 'https://twitter.com' },
                            { icon: Linkedin, href: 'https://linkedin.com' },
                        ].map(({ icon: Icon, href }) => (
                            <a key={href} href={href} target="_blank" rel="noreferrer" style={{
                                width: '34px', height: '34px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s'
                            }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(212,255,0,0.12)'; e.currentTarget.style.color = '#d4ff00'; e.currentTarget.style.borderColor = 'rgba(212,255,0,0.3)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                                <Icon size={15} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Navigate
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {quickLinks.map(({ label, action }) => (
                            <button key={label} onClick={action} style={linkStyle}
                                onMouseOver={e => handleLinkHover(e, true)}
                                onMouseOut={e => handleLinkHover(e, false)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product */}
                <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Product
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                            { label: 'AI Resume Analysis', icon: FileText },
                            { label: 'Job Listings', icon: Briefcase },
                            { label: 'AI Career Chat', icon: Sparkles },
                        ].map(({ label }) => (
                            <span key={label} style={{ ...linkStyle, cursor: 'default', color: 'rgba(255,255,255,0.35)' }}>
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Account */}
                <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Account
                    </div>
                    {user && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{user.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '2px' }}>{user.email}</div>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,60,60,0.1)',
                            border: '1px solid rgba(255,60,60,0.25)',
                            borderRadius: '10px', padding: '9px 16px',
                            color: '#ff6b6b', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,60,60,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,60,60,0.5)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,60,60,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,60,60,0.25)'; }}
                    >
                        <LogOut size={14} /> Log Out
                    </button>
                </div>
            </div>

            {/* Bottom bar */}
            <div style={{
                maxWidth: '1200px', margin: '0 auto',
                paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px'
            }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                    © {new Date().getFullYear()} Evolv. All rights reserved.
                </span>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {legalLinks.map(({ label, href }) => (
                        <a key={label} href={href} style={{ ...linkStyle, fontSize: '12px' }}
                            onMouseOver={e => handleLinkHover(e, true)}
                            onMouseOut={e => handleLinkHover(e, false)}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
