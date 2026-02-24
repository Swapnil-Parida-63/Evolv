import React, { useState, useEffect, useContext, useRef } from 'react';
import { Search, Briefcase, MapPin, Clock, ExternalLink, Building, ChevronDown, Loader, X } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

const s = {
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '12px',
        transition: 'border-color 0.2s'
    }
};

const SourceBadge = ({ source }) => {
    const colors = { LinkedIn: '#0a66c2', Naukri: '#fd7308', Wellfound: '#000' };
    return (
        <span style={{
            fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
            background: colors[source] || '#333', color: '#fff'
        }}>{source}</span>
    );
};

const ApplyModal = ({ job, onClose }) => {
    const [resume, setResume] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const { token } = useContext(AuthContext);
    const fileRef = useRef();

    const customFields = job.jobDetails?.customFields || [];

    const [answers, setAnswers] = useState(customFields.map(f => ({ label: f.label, answer: '' })));

    const handleSubmit = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.append('jobId', job._id);
        fd.append('coverLetter', coverLetter);
        fd.append('customAnswers', JSON.stringify(answers));
        if (resume) fd.append('resume', resume);

        const res = await fetch('/api/jobs/apply', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
        });

        if (res.ok) setDone(true);
        else {
            const err = await res.json();
            alert(err.message || 'Error submitting application');
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '24px'
            }}>
                {done ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{ color: '#d4ff00', marginBottom: '8px' }}>Application Submitted!</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Good luck! You can track it in "Applications".</p>
                        <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 28px', background: '#d4ff00', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Done</button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ color: '#fff', fontWeight: '700', margin: '0 0 4px' }}>{job.jobDetails?.title || 'Apply'}</h3>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{job.jobDetails?.company}</div>
                            </div>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', display: 'block' }}>Resume *</label>
                                <div onClick={() => fileRef.current.click()} style={{
                                    border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '10px',
                                    padding: '16px', textAlign: 'center', cursor: 'pointer',
                                    color: resume ? '#d4ff00' : 'rgba(255,255,255,0.35)', fontSize: '13px'
                                }}>
                                    {resume ? `✓ ${resume.name}` : '+ Upload Resume (PDF / DOCX)'}
                                </div>
                                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files[0])} style={{ display: 'none' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', display: 'block' }}>Cover Letter (optional)</label>
                                <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                                    placeholder="Why do you want this role?" style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                        padding: '10px 14px', color: '#fff', fontSize: '13px',
                                        resize: 'vertical', minHeight: '90px', outline: 'none', boxSizing: 'border-box'
                                    }} />
                            </div>

                            {customFields.map((field, i) => (
                                <div key={i}>
                                    <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', display: 'block' }}>
                                        {field.label} {field.required && <span style={{ color: '#ff5555' }}>*</span>}
                                    </label>
                                    <input value={answers[i]?.answer || ''} onChange={e => setAnswers(prev => prev.map((a, j) => j === i ? { ...a, answer: e.target.value } : a))}
                                        style={{
                                            width: '100%', background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                            padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                        }} />
                                </div>
                            ))}
                        </div>

                        <button onClick={handleSubmit} disabled={loading || !resume} style={{
                            marginTop: '20px', width: '100%', padding: '12px',
                            background: '#d4ff00', color: '#000', border: 'none', borderRadius: '12px',
                            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                            opacity: (loading || !resume) ? 0.5 : 1
                        }}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const JobCard = ({ job, isAI = false, hideApply = false }) => {
    const [expanded, setExpanded] = useState(false);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`applied_${job._id}`)) || false; } catch { return false; }
    });
    const details = isAI ? job : job.jobDetails;

    return (
        <div style={{ ...s.card, borderColor: expanded ? 'rgba(212,255,0,0.3)' : 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{details?.title}</span>
                        {isAI && details?.source && <SourceBadge source={details.source} />}
                        <span style={{
                            fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)'
                        }}>{details?.jobType || details?.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', flexWrap: 'wrap' }}>
                        <span><Building size={12} style={{ marginRight: '4px' }} />{details?.company || job.author?.name}</span>
                        <span><MapPin size={12} style={{ marginRight: '4px' }} />{details?.location}</span>
                        {(details?.salary || details?.salary) && <span>💰 {details.salary}</span>}
                        {isAI && <span><Clock size={12} style={{ marginRight: '4px' }} />{details?.postedWithin}</span>}
                        {!isAI && details?.experienceYears && <span>Exp: {details.experienceYears} yrs</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    {isAI ? (
                        <a href={details?.applyUrl} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#0a66c2', color: '#fff', textDecoration: 'none',
                            padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600'
                        }}>
                            Apply <ExternalLink size={12} />
                        </a>
                    ) : !hideApply && (
                        <button
                            onClick={() => !applied && setApplying(true)}
                            disabled={applied}
                            style={{
                                background: applied ? 'rgba(255,255,255,0.06)' : 'rgba(212,255,0,0.15)',
                                border: `1px solid ${applied ? 'rgba(255,255,255,0.1)' : 'rgba(212,255,0,0.3)'}`,
                                color: applied ? 'rgba(255,255,255,0.35)' : '#d4ff00',
                                borderRadius: '10px', padding: '8px 14px',
                                cursor: applied ? 'default' : 'pointer', fontSize: '13px', fontWeight: '600'
                            }}
                        >
                            {applied ? '✓ Applied' : 'Apply'}
                        </button>
                    )}
                    <button onClick={() => setExpanded(v => !v)} style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                        <ChevronDown size={15} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '12px' }}>
                        {details?.description}
                    </p>
                    {(details?.skills || details?.requirements)?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(details.skills || details.requirements).map((s, i) => (
                                <span key={i} style={{
                                    fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                                    background: 'rgba(212,255,0,0.08)', color: '#d4ff00', border: '1px solid rgba(212,255,0,0.2)'
                                }}>{s}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {applying && (
                <ApplyModal
                    job={job}
                    onClose={() => setApplying(false)}
                    onApplied={() => {
                        setApplied(true);
                        localStorage.setItem(`applied_${job._id}`, 'true');
                        setApplying(false);
                    }}
                />
            )}
        </div>
    );
};

const JobsSection = () => {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('ai');
    const [aiJobs, setAiJobs] = useState([]);
    const [dbJobs, setDbJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dbPage, setDbPage] = useState(1);
    const [dbHasMore, setDbHasMore] = useState(true);
    const { token, user } = useContext(AuthContext);
    const isRecruiterOrCompany = user?.accountType === 'recruiter' || user?.accountType === 'company';

    const fetchAiJobs = async () => {
        setLoading(true);
        const res = await fetch(`/api/jobs/ai-suggestions${query ? `?q=${encodeURIComponent(query)}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAiJobs(await res.json());
        setLoading(false);
    };

    const fetchDbJobs = async (p = 1, reset = false) => {
        setLoading(true);
        const res = await fetch(`/api/jobs/listings?page=${p}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setDbJobs(prev => reset ? data.listings : [...prev, ...data.listings]);
            setDbHasMore(data.hasMore);
            setDbPage(p);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAiJobs();
        fetchDbJobs(1, true);
    }, []);

    return (
        <div>
            {/* Search bar */}
            <div style={{
                display: 'flex', gap: '10px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '12px 16px', alignItems: 'center'
            }}>
                <Search size={18} color="rgba(255,255,255,0.3)" />
                <input
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchAiJobs()}
                    placeholder="Search jobs (e.g. React developer, ML engineer...)"
                    style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: '#fff', fontSize: '14px'
                    }} />
                <button onClick={fetchAiJobs} style={{
                    background: '#d4ff00', color: '#000', border: 'none', borderRadius: '8px',
                    padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}>{loading ? <Loader size={14} /> : 'Search'}</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {[
                    { id: 'ai', label: '🤖 AI-Suggested Jobs' },
                    { id: 'company', label: '🏢 Company Postings' }
                ].map(({ id, label }) => (
                    <button key={id} onClick={() => setTab(id)} style={{
                        padding: '8px 18px', borderRadius: '20px', border: '1px solid',
                        borderColor: tab === id ? '#d4ff00' : 'rgba(255,255,255,0.1)',
                        background: tab === id ? 'rgba(212,255,0,0.1)' : 'transparent',
                        color: tab === id ? '#d4ff00' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                    }}>{label}</button>
                ))}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    <Loader size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <p style={{ marginTop: '12px', fontSize: '14px' }}>Finding the best jobs for you...</p>
                </div>
            )}

            {!loading && tab === 'ai' && (
                <>
                    {aiJobs.length === 0
                        ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No results. Try a different search.</div>
                        : aiJobs.map(job => <JobCard key={job.id || Math.random()} job={job} isAI={true} />)
                    }
                </>
            )}

            {!loading && tab === 'company' && (
                <>
                    {dbJobs.length === 0
                        ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                            <Building size={36} style={{ marginBottom: '12px', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                            <p>No company job listings yet. Recruiters can post openings in the Feed.</p>
                        </div>
                        : (<>
                            {dbJobs.map(job => (
                                <JobCard
                                    key={job._id} job={job} isAI={false}
                                    hideApply={isRecruiterOrCompany || job.author?._id === user?._id}
                                />
                            ))}
                            {dbHasMore && (
                                <button onClick={() => fetchDbJobs(dbPage + 1)} style={{
                                    width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px'
                                }}>Load more</button>
                            )}
                        </>)
                    }
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default JobsSection;
