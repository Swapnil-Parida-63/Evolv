import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Shield, MessageSquare, Briefcase, FileText } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Header = ({ onOpenOptimizer, onOpenAdmin, isAdmin }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHub = location.pathname === '/hub';
    const { user } = useContext(AuthContext);

    return (
        <header style={{
            padding: '16px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
            <div style={{ fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-1px', cursor: 'pointer' }}
                onClick={() => navigate('/dashboard')}>
                Evolv
            </div>

            {/* Main nav tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '30px', padding: '4px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: !isHub ? 'rgba(255,255,255,0.15)' : 'transparent',
                        border: 'none',
                        borderRadius: '30px',
                        padding: '8px 18px',
                        color: !isHub ? '#fff' : 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    <FileText size={15} /> Resume AI
                </button>
                <button
                    onClick={() => navigate('/hub')}
                    style={{
                        background: isHub ? 'rgba(255,255,255,0.15)' : 'transparent',
                        border: 'none',
                        borderRadius: '30px',
                        padding: '8px 18px',
                        color: isHub ? '#fff' : 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    <Briefcase size={15} /> Evolv Hub
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {isAdmin && (
                    <button onClick={onOpenAdmin} style={{
                        background: 'rgba(212, 255, 0, 0.1)', border: '1px solid var(--color-primary)',
                        borderRadius: '30px', padding: '8px 16px', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: '600'
                    }}>
                        <Shield size={14} /><span>Admin</span>
                    </button>
                )}
                <button
                    onClick={onOpenOptimizer}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '30px', padding: '8px 16px', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <MessageSquare size={16} color="white" />
                    <span>AI Chat</span>
                    <Sparkles size={14} color="var(--color-primary)" />
                </button>

                {/* Profile avatar */}
                {user && (
                    <div
                        onClick={() => navigate('/profile')}
                        title={user.name}
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '15px', fontWeight: '800', color: '#000',
                            cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                            border: '2px solid rgba(212,255,0,0.3)',
                            transition: 'transform 0.15s, border-color 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = '#d4ff00'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(212,255,0,0.3)'; }}
                    >
                        {user.avatar
                            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : user.name?.[0]?.toUpperCase()
                        }
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
