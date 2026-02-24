import React, { useState, useContext, useEffect, useRef } from 'react';
import { Edit2, Save, Plus, X, Camera, Github, Linkedin, Globe, Briefcase } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box'
};

const UserProfile = () => {
    const { token, user: authUser, setUser } = useContext(AuthContext);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [posts, setPosts] = useState([]);
    const avatarRef = useRef();

    const [form, setForm] = useState({
        headline: '', bio: '', skills: [], lookingFor: '',
        accountType: 'student',
        links: { github: '', linkedin: '', portfolio: '' },
        education: []
    });
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        if (authUser) {
            setForm({
                headline: authUser.headline || '',
                bio: authUser.bio || '',
                skills: authUser.skills || [],
                lookingFor: authUser.lookingFor || '',
                accountType: authUser.accountType || 'student',
                links: authUser.links || { github: '', linkedin: '', portfolio: '' },
                education: authUser.education || []
            });
        }
    }, [authUser]);

    useEffect(() => {
        if (authUser?._id) {
            fetch(`/api/social/profile/${authUser._id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.json()).then(setPosts).catch(() => { });
        }
    }, [authUser]);

    const handleSave = async () => {
        setSaving(true);
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        if (res.ok) {
            const updated = await res.json();
            if (setUser) setUser(updated);
            setEditing(false);
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('avatar', file);
        const res = await fetch('/api/auth/avatar', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        if (res.ok) {
            const d = await res.json();
            if (setUser) setUser(prev => ({ ...prev, avatar: d.avatar }));
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
            setForm(p => ({ ...p, skills: [...p.skills, skillInput.trim()] }));
            setSkillInput('');
        }
    };

    const addEducation = () => {
        setForm(p => ({ ...p, education: [...p.education, { school: '', degree: '', from: '', to: '' }] }));
    };

    const user = authUser;

    return (
        <div>
            {/* Profile Header Card */}
            <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '28px', marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                            background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: '700', color: '#000', border: '3px solid rgba(212,255,0,0.3)'
                        }}>
                            {user?.avatar
                                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : user?.name?.[0]?.toUpperCase()
                            }
                        </div>
                        <button onClick={() => avatarRef.current.click()} style={{
                            position: 'absolute', bottom: '0', right: '-4px',
                            background: '#d4ff00', border: 'none', borderRadius: '50%',
                            width: '26px', height: '26px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer'
                        }}>
                            <Camera size={13} color="#000" />
                        </button>
                        <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '22px', margin: '0 0 4px' }}>{user?.name}</h2>
                                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>{user?.email}</div>
                                {!editing && form.headline && <div style={{ color: '#d4ff00', fontSize: '14px', marginTop: '4px' }}>{form.headline}</div>}
                            </div>
                            <button onClick={editing ? handleSave : () => setEditing(true)} style={{
                                background: editing ? '#d4ff00' : 'rgba(255,255,255,0.08)',
                                border: 'none', borderRadius: '10px', padding: '8px 16px',
                                color: editing ? '#000' : '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '7px',
                                fontWeight: '600', fontSize: '13px'
                            }}>
                                {editing ? <><Save size={14} />{saving ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} /> Edit Profile</>}
                            </button>
                        </div>

                        {!editing && form.bio && (
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '10px', lineHeight: '1.6' }}>{form.bio}</p>
                        )}

                        {/* Links */}
                        {!editing && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                {form.links?.github && <a href={form.links.github} target="_blank" rel="noreferrer" style={{ color: '#d4ff00', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Github size={14} /> GitHub</a>}
                                {form.links?.linkedin && <a href={form.links.linkedin} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Linkedin size={14} /> LinkedIn</a>}
                                {form.links?.portfolio && <a href={form.links.portfolio} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Globe size={14} /> Portfolio</a>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                {editing && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>Account Type</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['student', 'recruiter'].map(t => (
                                    <button key={t} onClick={() => setForm(p => ({ ...p, accountType: t }))} style={{
                                        padding: '7px 16px', borderRadius: '20px', border: '1px solid',
                                        borderColor: form.accountType === t ? '#d4ff00' : 'rgba(255,255,255,0.15)',
                                        background: form.accountType === t ? 'rgba(212,255,0,0.1)' : 'transparent',
                                        color: form.accountType === t ? '#d4ff00' : 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer', fontSize: '13px'
                                    }}>
                                        {t === 'student' ? '👨‍💻 Student / Dev' : '🏢 Recruiter'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input placeholder="Headline (e.g. Full Stack Developer)" value={form.headline}
                            onChange={e => setForm(p => ({ ...p, headline: e.target.value }))} style={inputStyle} />
                        <textarea placeholder="Bio — describe yourself, what you do, your goals..." value={form.bio}
                            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} />
                        <input placeholder="Looking for (e.g. Full-stack role at a startup)" value={form.lookingFor}
                            onChange={e => setForm(p => ({ ...p, lookingFor: e.target.value }))} style={inputStyle} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Links</label>
                            <div style={{ position: 'relative' }}>
                                <Github size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input placeholder="GitHub URL" value={form.links.github}
                                    onChange={e => setForm(p => ({ ...p, links: { ...p.links, github: e.target.value } }))}
                                    style={{ ...inputStyle, paddingLeft: '34px' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Linkedin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input placeholder="LinkedIn URL" value={form.links.linkedin}
                                    onChange={e => setForm(p => ({ ...p, links: { ...p.links, linkedin: e.target.value } }))}
                                    style={{ ...inputStyle, paddingLeft: '34px' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Globe size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input placeholder="Portfolio URL" value={form.links.portfolio}
                                    onChange={e => setForm(p => ({ ...p, links: { ...p.links, portfolio: e.target.value } }))}
                                    style={{ ...inputStyle, paddingLeft: '34px' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Skills */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <h4 style={{ color: '#fff', margin: '0 0 14px', fontWeight: '700' }}>Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: editing ? '12px' : 0 }}>
                    {form.skills.map((skill, i) => (
                        <span key={i} style={{
                            background: 'rgba(212,255,0,0.1)', color: '#d4ff00', border: '1px solid rgba(212,255,0,0.25)',
                            borderRadius: '20px', padding: '5px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {skill}
                            {editing && <button onClick={() => setForm(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4ff00', padding: 0, display: 'flex' }}>
                                <X size={11} />
                            </button>}
                        </span>
                    ))}
                    {form.skills.length === 0 && !editing && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No skills added yet.</span>}
                </div>
                {editing && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSkill()}
                            placeholder="Add a skill..." style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={addSkill} style={{
                            background: 'rgba(212,255,0,0.15)', border: '1px solid rgba(212,255,0,0.3)',
                            color: '#d4ff00', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer'
                        }}><Plus size={16} /></button>
                    </div>
                )}
            </div>

            {/* Education */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ color: '#fff', margin: 0, fontWeight: '700' }}>Education</h4>
                    {editing && <button onClick={addEducation} style={{
                        background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.3)',
                        color: '#d4ff00', borderRadius: '8px', padding: '6px 12px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'
                    }}><Plus size={13} /> Add</button>}
                </div>
                {form.education.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No education entries.</div>}
                {form.education.map((edu, i) => (
                    <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input placeholder="School / University" value={edu.school}
                                        onChange={e => { const copy = [...form.education]; copy[i].school = e.target.value; setForm(p => ({ ...p, education: copy })); }}
                                        style={{ ...inputStyle, flex: 1 }} />
                                    <button onClick={() => setForm(p => ({ ...p, education: p.education.filter((_, j) => j !== i) }))}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,80,80,0.6)' }}>
                                        <X size={15} />
                                    </button>
                                </div>
                                <input placeholder="Degree" value={edu.degree}
                                    onChange={e => { const copy = [...form.education]; copy[i].degree = e.target.value; setForm(p => ({ ...p, education: copy })); }}
                                    style={inputStyle} />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input placeholder="From (e.g. 2020)" value={edu.from}
                                        onChange={e => { const copy = [...form.education]; copy[i].from = e.target.value; setForm(p => ({ ...p, education: copy })); }}
                                        style={{ ...inputStyle, flex: 1 }} />
                                    <input placeholder="To (e.g. 2024)" value={edu.to}
                                        onChange={e => { const copy = [...form.education]; copy[i].to = e.target.value; setForm(p => ({ ...p, education: copy })); }}
                                        style={{ ...inputStyle, flex: 1 }} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{edu.school}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{edu.degree}</div>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '2px' }}>{edu.from} – {edu.to || 'Present'}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* My Posts */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ color: '#fff', margin: '0 0 14px', fontWeight: '700' }}>My Posts ({posts.length})</h4>
                {posts.length === 0
                    ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No posts yet</div>
                    : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                            {posts.slice(0, 9).map(post => (
                                <div key={post._id} style={{
                                    aspectRatio: '1', borderRadius: '10px', overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.07)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {post.media?.[0]
                                        ? <img src={post.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '8px', textAlign: 'center', overflow: 'hidden' }}>
                                            {post.content?.substring(0, 60)}...
                                        </p>
                                    }
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default UserProfile;
