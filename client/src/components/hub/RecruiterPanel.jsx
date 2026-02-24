import React, { useState, useEffect, useContext } from 'react';
import { Briefcase, Users, ChevronRight, ArrowLeft, Sparkles, FileText, Mail, Phone, Link, Check, X, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '10px' }
};

const StatusBadge = ({ status }) => {
    const colors = { pending: '#888', reviewed: '#3b82f6', shortlisted: '#d4ff00', rejected: '#ff5555' };
    return (
        <span style={{
            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
            background: `${colors[status]}20`, color: colors[status], border: `1px solid ${colors[status]}40`
        }}>{status?.toUpperCase()}</span>
    );
};

// --- STUDENT VIEW: My Applications ---
const MyApplications = () => {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        fetch('/api/jobs/my-applications', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(d => { setApps(d); setLoading(false); });
    }, []);

    const handleWithdraw = async (id) => {
        if (!confirm('Withdraw this application?')) return;
        await fetch(`/api/jobs/application/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        setApps(prev => prev.filter(a => a._id !== id));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>;

    return (
        <div>
            <h3 style={{ color: '#fff', fontWeight: '700', marginBottom: '16px' }}>My Applications ({apps.length})</h3>
            {apps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                    <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                    <p>You haven't applied to any jobs yet.</p>
                </div>
            )}
            {apps.map(app => (
                <div key={app._id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px', marginBottom: '4px' }}>
                                {app.job?.jobDetails?.title || 'Job'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                                {app.job?.author?.name} · {app.job?.jobDetails?.location}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <StatusBadge status={app.status} />
                            <button onClick={() => handleWithdraw(app._id)} style={{
                                background: 'transparent', border: '1px solid rgba(255,80,80,0.3)',
                                color: 'rgba(255,80,80,0.7)', borderRadius: '8px', padding: '5px 10px',
                                cursor: 'pointer', fontSize: '12px'
                            }}>Withdraw</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- RECRUITER: Create Job Opening Form ---
const CreateJobForm = ({ onCreated }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const [form, setForm] = useState({
        title: '', company: '', location: '', salary: '', jobType: 'Full-time', description: ''
    });
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleCreate = async () => {
        if (!form.title || !form.description) { setError('Title and description are required.'); return; }
        setLoading(true); setError('');
        const body = {
            type: 'jobListing',
            content: form.description,
            jobDetails: { title: form.title, company: form.company, location: form.location, salary: form.salary, jobType: form.jobType }
        };
        const res = await fetch('/api/social/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            const newPost = await res.json();
            setForm({ title: '', company: '', location: '', salary: '', jobType: 'Full-time', description: '' });
            setOpen(false);
            onCreated && onCreated(newPost);
        } else {
            const d = await res.json();
            setError(d.message || 'Error creating job');
        }
        setLoading(false);
    };

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '9px 13px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
    };

    return (
        <div style={{ background: 'rgba(212,255,0,0.05)', border: '1px solid rgba(212,255,0,0.2)', borderRadius: '14px', marginBottom: '20px', overflow: 'hidden' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#d4ff00', fontWeight: '700', fontSize: '14px' }}
            >
                <Plus size={16} /> Post a New Job Opening
                <span style={{ marginLeft: 'auto' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
            </button>

            {open && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Job Title *" style={inputStyle} />
                        <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company Name" style={inputStyle} />
                        <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Location (e.g. Remote, Mumbai)" style={inputStyle} />
                        <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="Salary (e.g. 5-8 LPA)" style={inputStyle} />
                    </div>
                    <select value={form.jobType} onChange={e => set('jobType', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote'].map(t => (
                            <option key={t} value={t} style={{ background: '#111' }}>{t}</option>
                        ))}
                    </select>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Job description, requirements, responsibilities... *"
                        rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                    />
                    {error && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => setOpen(false)} style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        <button onClick={handleCreate} disabled={loading} style={{ padding: '9px 22px', borderRadius: '10px', background: '#d4ff00', border: 'none', color: '#000', fontWeight: '700', fontSize: '13px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Posting...' : 'Post Job'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const AISummary = ({ summary, loading }) => {
    if (loading) return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>
            <Sparkles size={24} style={{ animation: 'spin 1.5s linear infinite', display: 'block', margin: '0 auto 12px', color: '#d4ff00' }} />
            Generating AI summary...
        </div>
    );
    if (!summary) return null;

    const fitColors = { 'Strong Fit': '#d4ff00', 'Good Fit': '#4ade80', 'Moderate Fit': '#fb923c', 'Weak Fit': '#f87171' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
                background: `${fitColors[summary.overallFit] || '#888'}18`,
                border: `1px solid ${fitColors[summary.overallFit] || '#888'}40`,
                borderRadius: '12px', padding: '14px'
            }}>
                <div style={{ fontWeight: '700', color: fitColors[summary.overallFit] || '#888', marginBottom: '4px' }}>
                    {summary.overallFit}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{summary.fitReason}</div>
            </div>

            <div style={s.card}>
                <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '8px', fontSize: '13px' }}>📋 Resume Summary</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>{summary.resumeSummary}</p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    Level: <span style={{ color: '#fff' }}>{summary.experienceLevel}</span>
                </div>
            </div>

            <div style={s.card}>
                <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '8px', fontSize: '13px' }}>🚀 Projects ({summary.projects?.deployed || 0} deployed)</div>
                {summary.projects?.highlights?.map((h, i) => <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>• {h}</div>)}
            </div>

            <div style={s.card}>
                <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '8px', fontSize: '13px' }}>⚙️ Tech Stack</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {summary.techStack?.map((t, i) => (
                        <span key={i} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: '#fff' }}>{t}</span>
                    ))}
                </div>
            </div>

            <div style={s.card}>
                <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '10px', fontSize: '13px' }}>📞 Contact Info</div>
                {summary.contactInfo?.emails?.map((e, i) => <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}><Mail size={12} /> {e}</div>)}
                {summary.contactInfo?.phones?.map((p, i) => <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}><Phone size={12} /> {p}</div>)}
                {summary.contactInfo?.links?.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px', fontSize: '13px', color: '#d4ff00' }}><Link size={12} /> {l}</a>)}
            </div>
        </div>
    );
};

// --- APPLICATION DETAIL ---
const ApplicationDetail = ({ appId, onBack }) => {
    const [app, setApp] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [status, setStatus] = useState('pending');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        fetch(`/api/jobs/recruiter/application/${appId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(d => { setApp(d); setStatus(d.status); });
    }, [appId]);

    const handleSummary = async () => {
        setShowSummary(true);
        if (summaryData) return;
        setSummaryLoading(true);
        const res = await fetch(`/api/jobs/recruiter/application/${appId}/summary`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText: '' })
        });
        if (res.ok) setSummaryData(await res.json());
        setSummaryLoading(false);
    };

    const updateStatus = async (newStatus) => {
        setStatus(newStatus);
        await fetch(`/api/jobs/recruiter/application/${appId}/status`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    };

    if (!app) return <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>;

    const applicant = app.applicant;

    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            {/* Main application */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <button onClick={onBack} style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', marginBottom: '16px', padding: 0
                }}>
                    <ArrowLeft size={15} /> Back to applications
                </button>

                <div style={{ ...s.card, marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '700', fontSize: '20px', color: '#000', overflow: 'hidden', flexShrink: 0
                            }}>
                                {applicant?.avatar
                                    ? <img src={applicant.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : applicant?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{applicant?.name}</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{applicant?.email}</div>
                                {applicant?.headline && <div style={{ fontSize: '13px', color: '#d4ff00', marginTop: '2px' }}>{applicant.headline}</div>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select value={status} onChange={e => updateStatus(e.target.value)} style={{
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px', padding: '7px 12px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer'
                            }}>
                                {['pending', 'reviewed', 'shortlisted', 'rejected'].map(s => (
                                    <option key={s} value={s} style={{ background: '#111' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                            <button onClick={handleSummary} style={{
                                background: showSummary ? '#d4ff00' : 'rgba(212,255,0,0.1)',
                                border: '1px solid rgba(212,255,0,0.3)', color: showSummary ? '#000' : '#d4ff00',
                                borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600'
                            }}>
                                <Sparkles size={14} /> AI Summary
                            </button>
                        </div>
                    </div>
                </div>

                {app.coverLetter && (
                    <div style={{ ...s.card, marginBottom: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '10px', fontSize: '13px' }}>Cover Letter</div>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>{app.coverLetter}</p>
                    </div>
                )}

                {app.customAnswers?.length > 0 && (
                    <div style={s.card}>
                        <div style={{ fontWeight: '600', color: '#d4ff00', marginBottom: '12px', fontSize: '13px' }}>Application Answers</div>
                        {app.customAnswers.map((a, i) => (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '4px' }}>{a.label}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>{a.answer || '—'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {app.resume && (
                    <a href={app.resume} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '14px 18px', color: '#d4ff00',
                        textDecoration: 'none', fontWeight: '600', fontSize: '14px'
                    }}>
                        <FileText size={16} /> View Resume ↗
                    </a>
                )}
            </div>

            {/* AI Summary panel */}
            {showSummary && (
                <div style={{
                    width: '320px', flexShrink: 0, background: 'rgba(212,255,0,0.03)',
                    border: '1px solid rgba(212,255,0,0.15)', borderRadius: '16px', padding: '18px',
                    height: 'fit-content', position: 'sticky', top: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontWeight: '700', color: '#d4ff00', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Sparkles size={15} /> AI Summary
                        </div>
                        <button onClick={() => setShowSummary(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                            <X size={15} />
                        </button>
                    </div>
                    <AISummary summary={summaryData} loading={summaryLoading} />
                </div>
            )}
        </div>
    );
};

// --- RECRUITER PANEL: Root ---
const RecruiterPanel = () => {
    const { user } = useContext(AuthContext);
    const isRecruiter = user?.accountType === 'recruiter';
    const [openings, setOpenings] = useState([]);
    const [selectedOpening, setSelectedOpening] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loadingApps, setLoadingApps] = useState(false);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (isRecruiter) {
            fetch('/api/jobs/recruiter/openings', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.json()).then(setOpenings);
        }
    }, [isRecruiter]);

    const selectOpening = async (opening) => {
        setSelectedOpening(opening);
        setSelectedApp(null);
        setLoadingApps(true);
        const res = await fetch(`/api/jobs/recruiter/applications/${opening._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setApplications(await res.json());
        setLoadingApps(false);
    };

    // Student view
    if (!isRecruiter) return <MyApplications />;

    // Recruiter: application detail
    if (selectedApp) return <ApplicationDetail appId={selectedApp._id} onBack={() => setSelectedApp(null)} />;

    return (
        <div>
            <h3 style={{ color: '#fff', fontWeight: '700', marginBottom: '4px' }}>Recruiter Panel</h3>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '20px' }}>Manage your job openings and applications.</div>

            {/* Job creation form */}
            <CreateJobForm onCreated={(newPost) => {
                // Add newly created opening to list
                setOpenings(prev => [newPost, ...prev]);
            }} />

            {/* Openings tabs */}
            {openings.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {openings.map(o => (
                        <button key={o._id} onClick={() => selectOpening(o)} style={{
                            padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                            borderColor: selectedOpening?._id === o._id ? '#d4ff00' : 'rgba(255,255,255,0.12)',
                            background: selectedOpening?._id === o._id ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.04)',
                            color: selectedOpening?._id === o._id ? '#d4ff00' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                        }}>
                            <Briefcase size={12} style={{ marginRight: '6px' }} />
                            {o.jobDetails?.title}
                        </button>
                    ))}
                </div>
            )}

            {openings.length === 0 && (
                <div style={{ ...s.card, textAlign: 'center', padding: '40px' }}>
                    <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No job openings yet. Create a "Job Opening" post in the Feed!</p>
                </div>
            )}

            {/* Applications list */}
            {selectedOpening && (
                <div>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '12px', fontSize: '15px' }}>
                        Applications for "{selectedOpening.jobDetails?.title}" ({applications.length})
                    </div>
                    {loadingApps && <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '30px' }}>Loading...</div>}
                    {!loadingApps && applications.length === 0 && (
                        <div style={{ ...s.card, textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)' }}>No applications yet.</div>
                    )}
                    {applications.map(app => (
                        <div key={app._id} style={{ ...s.card, cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onClick={() => setSelectedApp(app)}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,255,0,0.3)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '700', color: '#000', fontSize: '16px', overflow: 'hidden', flexShrink: 0
                                    }}>
                                        {app.applicant?.avatar
                                            ? <img src={app.applicant.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : app.applicant?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{app.applicant?.name}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            {app.applicant?.headline || app.applicant?.email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <StatusBadge status={app.status} />
                                    <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecruiterPanel;
