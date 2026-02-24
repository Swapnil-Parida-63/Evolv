import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rss, Briefcase, User, Inbox, MessageCircle } from 'lucide-react';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';
import DMPanel from '../components/DMPanel';
import Footer from '../components/Footer';
import SocialFeed from '../components/hub/SocialFeed';
import JobsSection from '../components/hub/JobsSection';
import UserProfile from '../components/hub/UserProfile';
import RecruiterPanel from '../components/hub/RecruiterPanel';
import AuthContext from '../context/AuthContext';

const NAV_ITEMS = [
    { id: 'feed', label: 'Feed', icon: Rss },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'applications', label: 'Applications', icon: Inbox }
];

const HubPage = () => {
    const [activeTab, setActiveTab] = useState('feed');
    const [chatOpen, setChatOpen] = useState(false);
    const [dmOpen, setDmOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const renderContent = () => {
        switch (activeTab) {
            case 'feed': return <SocialFeed />;
            case 'jobs': return <JobsSection />;
            case 'profile': return <UserProfile />;
            case 'applications': return <RecruiterPanel />;
            default: return <SocialFeed />;
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg, #0f0f0f)', color: '#fff' }}>
            <Header
                onOpenOptimizer={() => setChatOpen(true)}
                isAdmin={user?.role === 'admin' || user?.role === 'evolv_admin'}
            />

            <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', gap: '24px' }}>
                {/* Left Sidebar Nav */}
                <aside style={{
                    width: '200px',
                    flexShrink: 0,
                    position: 'sticky',
                    top: '24px',
                    height: 'fit-content'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                style={{
                                    background: activeTab === id ? 'rgba(212,255,0,0.1)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    color: activeTab === id ? 'var(--color-primary, #d4ff00)' : 'rgba(255,255,255,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: activeTab === id ? '600' : '400',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                        {/* DM Button */}
                        <button
                            onClick={() => setDmOpen(true)}
                            style={{
                                background: dmOpen ? 'rgba(212,255,0,0.1)' : 'transparent',
                                border: 'none', borderRadius: '10px', padding: '10px 14px',
                                color: dmOpen ? 'var(--color-primary, #d4ff00)' : 'rgba(255,255,255,0.6)',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                cursor: 'pointer', fontSize: '14px', fontWeight: '400',
                                textAlign: 'left', width: '100%', transition: 'all 0.15s'
                            }}
                        >
                            <MessageCircle size={16} /> Messages
                        </button>
                    </div>

                    {/* User info card — clickable to own profile */}
                    {user && (
                        <div
                            onClick={() => navigate('/profile')}
                            style={{
                                marginTop: '16px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px', padding: '16px', textAlign: 'center',
                                cursor: 'pointer', transition: 'border-color 0.15s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,255,0,0.35)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                                margin: '0 auto 10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px', fontWeight: '700', color: '#000',
                                overflow: 'hidden'
                            }}>
                                {user.avatar
                                    ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : user.name?.[0]?.toUpperCase()
                                }
                            </div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{user.name}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                                {user.accountType === 'recruiter' ? '🏢 Recruiter' : user.accountType === 'company' ? '🏢 Company' : '👨‍💻 Student / Dev'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(212,255,0,0.6)', marginTop: '6px' }}>View Profile →</div>
                        </div>
                    )}
                </aside>

                {/* Main content area */}
                <main style={{ flex: 1, minWidth: 0 }}>
                    {renderContent()}
                </main>
            </div>

            {/* Chat Sidebar — same as Dashboard */}
            <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />

            {/* DM Panel */}
            <DMPanel isOpen={dmOpen} onClose={() => setDmOpen(false)} />

            <Footer />
        </div>
    );
};

export default HubPage;
