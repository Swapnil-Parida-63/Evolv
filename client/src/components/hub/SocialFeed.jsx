import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Video, Send, Heart, MessageCircle, Share2, MoreHorizontal, ChevronLeft, ChevronRight, Trash2, Edit2, X, Briefcase, Plus, Rss } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import DMPanel from '../DMPanel';

const s = {
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px'
    },
    btn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        transition: 'all 0.15s'
    }
};

const Avatar = ({ user, size = 40 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: '700', color: '#000', flexShrink: 0, overflow: 'hidden'
    }}>
        {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.[0]?.toUpperCase() || '?'
        }
    </div>
);

const MediaCarousel = ({ media }) => {
    const [idx, setIdx] = useState(0);
    if (!media.length) return null;
    const item = media[idx];
    return (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
            {item.mimetype.startsWith('video')
                ? <video src={item.url} controls style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }} />
                : <img src={item.url} alt="" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
            }
            {media.length > 1 && (
                <>
                    <button onClick={() => setIdx(i => (i - 1 + media.length) % media.length)} style={{
                        position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                        padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex'
                    }}><ChevronLeft size={18} /></button>
                    <button onClick={() => setIdx(i => (i + 1) % media.length)} style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                        padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex'
                    }}><ChevronRight size={18} /></button>
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                        {media.map((_, i) => (
                            <div key={i} onClick={() => setIdx(i)} style={{
                                width: i === idx ? '20px' : '6px', height: '6px', borderRadius: '3px',
                                background: i === idx ? '#d4ff00' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s'
                            }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Apply to Job modal
const ApplyModal = ({ job, onClose, onApplied }) => {
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const fileRef = useRef();

    const handleApply = async () => {
        if (!resumeFile) { setError('Please attach your resume before submitting.'); return; }
        setLoading(true); setError('');
        const fd = new FormData();
        fd.append('jobId', job._id);
        fd.append('coverLetter', coverLetter);
        fd.append('resume', resumeFile);
        const res = await fetch('/api/jobs/apply', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
        });
        const data = await res.json();
        if (res.ok) { onApplied(); }
        else setError(data.message || 'Error applying');
        setLoading(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ color: '#fff', fontWeight: '800', margin: 0, fontSize: '18px' }}>Apply for {job.jobDetails?.title}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '13px' }}>{job.jobDetails?.company || ''}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={20} /></button>
                </div>

                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Cover letter (optional) — tell them why you're a great fit..."
                    style={{ width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }}
                />

                <div style={{ marginTop: '12px' }}>
                    <button onClick={() => fileRef.current.click()} style={{
                        background: resumeFile ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${resumeFile ? 'rgba(212,255,0,0.4)' : 'rgba(255,80,80,0.35)'}`,
                        borderRadius: '10px', padding: '9px 16px',
                        color: resumeFile ? '#d4ff00' : 'rgba(255,200,200,0.9)',
                        cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px'
                    }}>
                        📎 {resumeFile ? resumeFile.name : 'Attach Resume (PDF) — Required *'}
                    </button>
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => { setResumeFile(e.target.files[0]); setError(''); }} style={{ display: 'none' }} />
                </div>

                {error && <div style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '10px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                    <button onClick={handleApply} disabled={loading} style={{ padding: '10px 24px', borderRadius: '10px', background: '#d4ff00', border: 'none', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, onDelete, onLike, onComment, currentUserId, onStartDM, appliedJobIds = [] }) => {

    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
    const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
    const [following, setFollowing] = useState(false);
    const [showApply, setShowApply] = useState(false);
    const [applied, setApplied] = useState(appliedJobIds.includes(post._id));
    const [shareToast, setShareToast] = useState(false);
    const { token } = useContext(AuthContext);
    const isOwner = post.author?._id === currentUserId;
    const navigate = useNavigate();

    const handleFollow = async () => {
        const res = await fetch(`/api/users/${post.author._id}/follow`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const d = await res.json();
            setFollowing(d.following);
        }
    };

    const handleLike = async () => {
        const res = await fetch(`/api/social/post/${post._id}/like`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const d = await res.json();
            setLiked(d.liked);
            setLikeCount(d.likeCount);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        const res = await fetch(`/api/social/post/${post._id}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: commentText })
        });
        if (res.ok) {
            const c = await res.json();
            setComments(prev => [...prev, c]);
            setCommentText('');
        }
    };

    const timeAgo = (date) => {
        const sec = Math.floor((Date.now() - new Date(date)) / 1000);
        if (sec < 60) return 'just now';
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
        return `${Math.floor(sec / 86400)}d ago`;
    };

    return (
        <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${post.author?._id}`)}
                >
                    <Avatar user={post.author} />
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#fff' }}>{post.author?.name}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            {post.author?.headline || (post.author?.accountType === 'recruiter' ? '🏢 Recruiter' : '👨‍💻 Developer')}
                            &nbsp;·&nbsp;{timeAgo(post.createdAt)}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isOwner && (
                        <>
                            <button onClick={handleFollow} style={{
                                ...s.btn, padding: '5px 12px', fontSize: '12px',
                                background: following ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.07)',
                                color: following ? '#d4ff00' : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${following ? 'rgba(212,255,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '20px'
                            }}>
                                {following ? '✓ Following' : '+ Follow'}
                            </button>
                            <button onClick={() => onStartDM && onStartDM(post.author)} style={{
                                ...s.btn, padding: '5px 10px', fontSize: '12px',
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px'
                            }}>💬 DM</button>
                        </>
                    )}
                    {isOwner && (
                        <button onClick={() => onDelete(post._id)} style={{ ...s.btn, padding: '6px' }}>
                            <Trash2 size={15} color="rgba(255,80,80,0.7)" />
                        </button>
                    )}
                </div>
            </div>

            {post.content && (
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)', marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                </p>
            )}

            {post.media?.length > 0 && <MediaCarousel media={post.media} />}

            {/* Job listing badge + Apply */}
            {post.type === 'jobListing' && post.jobDetails && (
                <div style={{
                    background: 'rgba(212,255,0,0.07)', border: '1px solid rgba(212,255,0,0.2)',
                    borderRadius: '10px', padding: '12px 16px', marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={15} color="#d4ff00" />
                            <span style={{ color: '#d4ff00', fontWeight: '700', fontSize: '15px' }}>{post.jobDetails.title}</span>
                            <span style={{ fontSize: '11px', background: 'rgba(212,255,0,0.15)', color: '#d4ff00', padding: '2px 8px', borderRadius: '20px' }}>
                                {post.jobDetails.jobType}
                            </span>
                        </div>
                        {!isOwner && (
                            <button
                                onClick={() => setShowApply(true)}
                                disabled={applied}
                                style={{
                                    background: applied ? 'rgba(255,255,255,0.07)' : '#d4ff00',
                                    border: 'none', borderRadius: '20px', padding: '6px 18px',
                                    color: applied ? 'rgba(255,255,255,0.4)' : '#000',
                                    fontWeight: '700', fontSize: '12px', cursor: applied ? 'default' : 'pointer'
                                }}
                            >
                                {applied ? '✓ Applied' : 'Apply Now'}
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        {post.jobDetails.location} {post.jobDetails.salary && `· ${post.jobDetails.salary}`}
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {showApply && (
                <ApplyModal
                    job={post}
                    onClose={() => setShowApply(false)}
                    onApplied={() => { setApplied(true); setShowApply(false); }}
                />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                <button onClick={handleLike} style={{ ...s.btn, color: liked ? '#d4ff00' : 'rgba(255,255,255,0.6)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <Heart size={16} fill={liked ? '#d4ff00' : 'none'} /> {likeCount} Like
                </button>
                <button onClick={() => setShowComments(v => !v)} style={s.btn}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <MessageCircle size={16} /> {comments.length} Comment
                </button>
                <button onClick={() => {
                    const link = `${window.location.origin}/post/${post._id}`;
                    navigator.clipboard?.writeText(link).then(() => {
                        setShareToast(true);
                        setTimeout(() => setShareToast(false), 2200);
                    });
                }} style={{ ...s.btn, position: 'relative' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <Share2 size={16} /> Share
                    {shareToast && (
                        <span style={{
                            position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                            background: '#d4ff00', color: '#000', fontSize: '11px', fontWeight: '700',
                            padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                            pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}>✓ Link copied!</span>
                    )}
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: '12px' }}>
                    {comments.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                            <Avatar user={c.author} size={30} />
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px', flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', color: '#d4ff00', marginBottom: '2px' }}>{c.author?.name}</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{c.text}</div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                            value={commentText} onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleComment()}
                            placeholder="Write a comment..." style={{
                                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none'
                            }} />
                        <button onClick={handleComment} style={{ ...s.btn, background: 'rgba(212,255,0,0.15)', color: '#d4ff00', padding: '8px 12px' }}>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreatePostModal = ({ onClose, onPost }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState('post');
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [jobDetails, setJobDetails] = useState({ title: '', company: '', location: '', jobType: 'Full-time', salary: '', description: '', requirements: '' });
    const [loading, setLoading] = useState(false);
    const { token } = useContext(AuthContext);
    const fileRef = useRef();

    const handleFiles = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(selected);
        setPreviews(selected.map(f => ({ url: URL.createObjectURL(f), mimetype: f.type })));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.append('content', content);
        fd.append('type', type);
        if (type === 'jobListing') {
            fd.append('jobDetails', JSON.stringify({
                ...jobDetails,
                requirements: jobDetails.requirements.split('\n').filter(Boolean)
            }));
        }
        files.forEach(f => fd.append('media', f));

        const res = await fetch('/api/social/post', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
        });
        if (res.ok) {
            const post = await res.json();
            onPost(post);
            onClose();
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <h3 style={{ color: '#fff', fontWeight: '700', margin: 0 }}>Create Post</h3>
                    <button onClick={onClose} style={{ ...s.btn, padding: '6px' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {['post', 'jobListing'].map(t => (
                        <button key={t} onClick={() => setType(t)} style={{
                            padding: '7px 16px', borderRadius: '20px', border: '1px solid',
                            borderColor: type === t ? '#d4ff00' : 'rgba(255,255,255,0.15)',
                            background: type === t ? 'rgba(212,255,0,0.1)' : 'transparent',
                            color: type === t ? '#d4ff00' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                        }}>
                            {t === 'post' ? '📝 Post' : '💼 Job Opening'}
                        </button>
                    ))}
                </div>

                <textarea value={content} onChange={e => setContent(e.target.value)}
                    placeholder={type === 'post' ? "Share something..." : "Describe the company and role..."}
                    style={{
                        width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                        padding: '12px', color: '#fff', fontSize: '14px', resize: 'vertical',
                        outline: 'none', boxSizing: 'border-box', lineHeight: '1.5'
                    }} />

                {type === 'jobListing' && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { key: 'title', placeholder: 'Job Title *' },
                            { key: 'company', placeholder: 'Company Name *' },
                            { key: 'location', placeholder: 'Location (e.g. Bangalore / Remote)' },
                            { key: 'salary', placeholder: 'Salary (optional, e.g. ₹8-12 LPA)' },
                        ].map(({ key, placeholder }) => (
                            <input key={key} placeholder={placeholder} value={jobDetails[key]}
                                onChange={e => setJobDetails(prev => ({ ...prev, [key]: e.target.value }))}
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                                }} />
                        ))}
                        <select value={jobDetails.jobType} onChange={e => setJobDetails(p => ({ ...p, jobType: e.target.value }))}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none'
                            }}>
                            {['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'].map(t => (
                                <option key={t} value={t} style={{ background: '#111' }}>{t}</option>
                            ))}
                        </select>
                        <textarea placeholder="Requirements (one per line)" value={jobDetails.requirements}
                            onChange={e => setJobDetails(p => ({ ...p, requirements: e.target.value }))}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px',
                                outline: 'none', resize: 'vertical', minHeight: '80px'
                            }} />
                    </div>
                )}

                {previews.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {previews.map((p, i) => (
                            <div key={i} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                {p.mimetype.startsWith('video')
                                    ? <video src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                }
                                <button onClick={() => { setFiles(f => f.filter((_, j) => j !== i)); setPreviews(pr => pr.filter((_, j) => j !== i)); }}
                                    style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <button onClick={() => fileRef.current.click()} style={{ ...s.btn, color: 'rgba(255,255,255,0.5)' }}>
                        <Image size={16} /> Photo / Video
                    </button>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} style={{ display: 'none' }} />
                    <button onClick={handleSubmit} disabled={loading || (!content.trim() && files.length === 0)} style={{
                        background: '#d4ff00', color: '#000', border: 'none', borderRadius: '10px',
                        padding: '10px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                        opacity: (loading || (!content.trim() && files.length === 0)) ? 0.5 : 1
                    }}>
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [dmOpen, setDmOpen] = useState(false);
    const [dmTarget, setDmTarget] = useState(null);
    const [appliedJobIds, setAppliedJobIds] = useState([]);
    const { token, user } = useContext(AuthContext);
    const isRecruiterOrCompany = user?.accountType === 'recruiter' || user?.accountType === 'company';

    const fetchFeed = async (p = 1, reset = false) => {
        setLoading(true);
        const res = await fetch(`/api/social/feed?page=${p}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
            setHasMore(data.hasMore);
            setPage(p);
        }
        setLoading(false);
    };

    // Fetch IDs of jobs user has already applied to — so applied state persists after refresh
    const fetchAppliedIds = async () => {
        if (isRecruiterOrCompany) return; // recruiters don't apply
        const res = await fetch('/api/jobs/my-applications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const apps = await res.json();
            setAppliedJobIds(apps.map(a => a.job?._id || a.job).filter(Boolean));
        }
    };

    useEffect(() => { fetchFeed(1, true); fetchAppliedIds(); }, []);

    const handleDelete = async (id) => {
        await fetch(`/api/social/post/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        setPosts(prev => prev.filter(p => p._id !== id));
    };

    const startDM = (targetUser) => {
        setDmTarget(targetUser);
        setDmOpen(true);
    };

    return (
        <div>
            {/* Create post prompt */}
            <div style={{ ...s.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }} onClick={() => setShowCreate(true)}>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '16px', color: '#000'
                }}>
                    {user?.name?.[0]?.toUpperCase()}
                </div>
                <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '30px',
                    padding: '12px 18px', color: 'rgba(255,255,255,0.35)', fontSize: '14px'
                }}>
                    Share a project, learning, or update...
                </div>
                <button onClick={e => { e.stopPropagation(); setShowCreate(true); }} style={{
                    background: 'rgba(212,255,0,0.12)', border: '1px solid rgba(212,255,0,0.3)',
                    borderRadius: '10px', padding: '8px 14px', color: '#d4ff00', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600'
                }}>
                    <Plus size={15} /> Post
                </button>
            </div>

            {posts.map(post => (
                <PostCard key={post._id} post={post} onDelete={handleDelete} currentUserId={user?._id}
                    onStartDM={startDM}
                    appliedJobIds={isRecruiterOrCompany ? [] : appliedJobIds}
                />
            ))}

            {hasMore && (
                <button onClick={() => fetchFeed(page + 1)} disabled={loading} style={{
                    width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
                    marginBottom: '20px'
                }}>
                    {loading ? 'Loading...' : 'Load more posts'}
                </button>
            )}

            {posts.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                    <Rss size={40} style={{ marginBottom: '16px', margin: '0 auto 16px', display: 'block' }} />
                    <p>No posts yet. Be the first to share!</p>
                </div>
            )}

            {showCreate && (
                <CreatePostModal
                    onClose={() => setShowCreate(false)}
                    onPost={post => { setPosts(prev => [post, ...prev]); }}
                />
            )}

            {/* DM Panel */}
            <DMPanel
                isOpen={dmOpen}
                onClose={() => { setDmOpen(false); setDmTarget(null); }}
                initialUser={dmTarget}
            />
        </div>
    );
};

export default SocialFeed;
