import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Link2, Github, Linkedin, MessageCircle, ExternalLink, Briefcase, Edit3, Check, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import DMPanel from '../components/DMPanel';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';

const BADGE_COLORS = {
    student: { bg: 'rgba(100,180,255,0.15)', color: '#64b4ff', label: '🎓 Student' },
    developer: { bg: 'rgba(180,100,255,0.15)', color: '#b464ff', label: '👨‍💻 Developer' },
    recruiter: { bg: 'rgba(255,180,50,0.15)', color: '#ffb432', label: '🔍 Recruiter' },
    company: { bg: 'rgba(212,255,0,0.15)', color: '#d4ff00', label: '🏢 Company' },
};

const Avatar = ({ user, size = 80 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: '800', color: '#000',
        border: '3px solid #0f0f0f', flexShrink: 0, overflow: 'hidden'
    }}>
        {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.[0]?.toUpperCase() || '?'
        }
    </div>
);

const timeAgo = (d) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(d).toLocaleDateString();
};

const ProfilePage = () => {
    const { userId } = useParams();
    const { user: me, token, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const isOwnProfile = !userId || userId === me?._id;

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [dmOpen, setDmOpen] = useState(false);
    const [dmTarget, setDmTarget] = useState(null);

    // Editable name state
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [savingName, setSavingName] = useState(false);

    const targetId = isOwnProfile ? me?._id : userId;

    useEffect(() => {
        if (!targetId) return;
        const loadProfile = async () => {
            setLoading(true);
            try {
                // Fetch user profile
                const res = await fetch(`/api/users/${targetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setFollowing(data.isFollowing || false);
                    setNewName(data.name);
                } else if (isOwnProfile) {
                    setProfile(me);
                    setNewName(me?.name || '');
                }

                // Fetch posts
                const postsRes = await fetch(`/api/social/profile/${targetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (postsRes.ok) setPosts(await postsRes.json());

                // Fetch jobs if company/recruiter
                const jobsRes = await fetch(`/api/jobs/company/${targetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (jobsRes.ok) setJobs(await jobsRes.json());
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        loadProfile();
    }, [targetId]);

    const handleFollow = async () => {
        const res = await fetch(`/api/users/${targetId}/follow`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const d = await res.json();
            setFollowing(d.following);
            setProfile(prev => ({ ...prev, followers: d.following ? [...(prev.followers || []), me._id] : (prev.followers || []).filter(f => f !== me._id) }));
        }
    };

    const handleSaveName = async () => {
        if (!newName.trim() || newName === profile?.name) { setEditingName(false); return; }
        setSavingName(true);
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newName.trim() })
        });
        if (res.ok) {
            const updated = await res.json();
            setProfile(prev => ({ ...prev, name: updated.name }));
            if (isOwnProfile && setUser) setUser({ name: updated.name });
        }
        setSavingName(false);
        setEditingName(false);
    };

    const displayProfile = profile || me;
    const badge = BADGE_COLORS[displayProfile?.accountType] || BADGE_COLORS.student;

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <Header onOpenOptimizer={() => setChatOpen(true)} isAdmin={me?.role === 'admin'} />
            Loading profile...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Header onOpenOptimizer={() => setChatOpen(true)} isAdmin={me?.role === 'admin'} />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Profile Card */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
                    {/* Cover */}
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, rgba(212,255,0,0.1) 100%)', position: 'relative' }} />

                    {/* Avatar + Info */}
                    <div style={{ padding: '0 28px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-44px', flexWrap: 'wrap', gap: '12px' }}>
                            <Avatar user={displayProfile} size={88} />
                            <div style={{ display: 'flex', gap: '10px', paddingBottom: '4px' }}>
                                {!isOwnProfile && (
                                    <>
                                        <button onClick={handleFollow} style={{
                                            padding: '8px 20px', borderRadius: '20px', border: `1px solid ${following ? 'rgba(212,255,0,0.4)' : 'rgba(255,255,255,0.2)'}`,
                                            background: following ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.08)',
                                            color: following ? '#d4ff00' : '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                                        }}>
                                            {following ? '✓ Following' : '+ Follow'}
                                        </button>
                                        <button onClick={() => { setDmTarget(displayProfile); setDmOpen(true); }} style={{
                                            padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            <MessageCircle size={14} /> Message
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Name (editable for own profile) */}
                        <div style={{ marginTop: '16px' }}>
                            {isOwnProfile && editingName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input value={newName} onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,255,0,0.4)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '22px', fontWeight: '700', outline: 'none', width: '260px' }}
                                        autoFocus
                                    />
                                    <button onClick={handleSaveName} disabled={savingName} style={{ background: '#d4ff00', border: 'none', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
                                        <Check size={16} color="#000" />
                                    </button>
                                    <button onClick={() => setEditingName(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
                                        <X size={16} color="rgba(255,255,255,0.6)" />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#fff' }}>{displayProfile?.name}</h1>
                                    {isOwnProfile && (
                                        <button onClick={() => setEditingName(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '4px', display: 'flex' }}>
                                            <Edit3 size={15} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Account type badge */}
                            <span style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', borderRadius: '20px', background: badge.bg, color: badge.color, fontSize: '12px', fontWeight: '600' }}>
                                {badge.label}
                            </span>

                            {displayProfile?.headline && (
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginTop: '8px', marginBottom: 0 }}>{displayProfile.headline}</p>
                            )}

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: '24px', marginTop: '14px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{displayProfile?.followers?.length || 0}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Followers</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{displayProfile?.following?.length || 0}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Following</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{posts.length}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Posts</div>
                                </div>
                            </div>

                            {/* Links */}
                            {displayProfile?.links && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
                                    {displayProfile.links.github && (
                                        <a href={displayProfile.links.github} target="_blank" rel="noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
                                            <Github size={14} /> GitHub
                                        </a>
                                    )}
                                    {displayProfile.links.linkedin && (
                                        <a href={displayProfile.links.linkedin} target="_blank" rel="noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
                                            <Linkedin size={14} /> LinkedIn
                                        </a>
                                    )}
                                    {displayProfile.links.portfolio && (
                                        <a href={displayProfile.links.portfolio} target="_blank" rel="noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none' }}>
                                            <Link2 size={14} /> Portfolio
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px', flexShrink: 0 }}>
                        {/* Bio */}
                        {displayProfile?.bio && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '10px' }}>About</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{displayProfile.bio}</p>
                            </div>
                        )}

                        {/* Skills (students/devs) */}
                        {displayProfile?.skills?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>Skills</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                    {displayProfile.skills.map((sk, i) => (
                                        <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.2)', color: '#d4ff00', fontSize: '12px', fontWeight: '600' }}>{sk}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {displayProfile?.education?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>Education</h3>
                                {displayProfile.education.map((ed, i) => (
                                    <div key={i} style={{ marginBottom: i < displayProfile.education.length - 1 ? '12px' : 0 }}>
                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{ed.school}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{ed.degree} · {ed.from}{ed.to ? ` – ${ed.to}` : ''}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Looking for */}
                        {displayProfile?.lookingFor && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>Looking for</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>{displayProfile.lookingFor}</p>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Job Openings — company/recruiter */}
                        {(displayProfile?.accountType === 'company' || displayProfile?.accountType === 'recruiter') && jobs.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                                <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={16} color="#d4ff00" /> Open Positions
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {jobs.map(job => (
                                        <div key={job._id} style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{job.title}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '3px' }}>{job.location} · {job.type} · {job.salary}</div>
                                                </div>
                                                {!isOwnProfile && (
                                                    <button onClick={() => navigate('/hub', { state: { tab: 'jobs', applyJob: job } })} style={{
                                                        background: '#d4ff00', border: 'none', borderRadius: '20px', padding: '6px 16px',
                                                        color: '#000', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                                    }}>
                                                        Apply
                                                    </button>
                                                )}
                                            </div>
                                            {job.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px', marginBottom: 0, lineHeight: '1.5' }}>{job.description.slice(0, 120)}...</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Posts Grid */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                            <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>Posts</h3>
                            {posts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No posts yet</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {posts.map(post => (
                                        <div key={post._id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '6px' }}>{timeAgo(post.createdAt)}</div>
                                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>{post.content?.slice(0, 180)}{post.content?.length > 180 ? '...' : ''}</p>
                                            {post.media?.[0] && (
                                                <img src={post.media[0].url} alt="" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginTop: '10px' }} />
                                            )}
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                                                <span>❤️ {post.likes?.length || 0}</span>
                                                <span>💬 {post.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            <DMPanel isOpen={dmOpen} onClose={() => { setDmOpen(false); setDmTarget(null); }} initialUser={dmTarget} />
        </div>
    );
};

export default ProfilePage;
