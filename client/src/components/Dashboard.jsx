import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Card from './Card';
import Header from './Header';
import ChatSidebar from './ChatSidebar';
import AdminDashboard from './AdminDashboard';
import Footer from './Footer';
import { Upload, Play, RefreshCw, CheckCircle, AlertCircle, Trash2, Shield, X, Users, Activity } from 'lucide-react';

const Dashboard = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showAdminPopup, setShowAdminPopup] = useState(false);
    const [showRoadmap, setShowRoadmap] = useState(false);

    const { token, logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Effect to check for admin promotion popup
    useEffect(() => {
        if (!user) {
            navigate('/auth');
        } else {
            // Check for new admin promotion
            if (user.isNewAdmin) {
                setShowAdminPopup(true);
                // Acknowledge promotion immediately or after close
                fetch('/api/admin/ack-promotion', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }
    }, [user, navigate, token]);

    // Effect to update analysis when selected resume changes
    useEffect(() => {
        if (selectedResumeId && resumes.length > 0) {
            const selected = resumes.find(r => r._id === selectedResumeId);
            if (selected) {
                setAnalysis(selected.analysisResult || null);
            }
        }
    }, [selectedResumeId, resumes]);

    // Initial load selection
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await fetch('/api/resume', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (res.ok) {
                    setResumes(data);
                    if (data.length > 0 && !selectedResumeId) {
                        setSelectedResumeId(data[0]._id);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (token) {
            fetchResumes();
        }
    }, [token]);

    const handleExpand = (cardId) => {
        setExpandedCard(cardId);
    };

    const handleClose = () => {
        setExpandedCard(null);
    };

    const handleResumeSelect = (resumeId, e) => {
        e.stopPropagation(); // Prevent card expansion if clicking on list item
        setSelectedResumeId(resumeId);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);

        setUploadStatus('uploading');

        try {
            const res = await fetch('/api/resume/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setResumes(prev => {
                    const exists = prev.find(r => r._id === data._id);
                    if (exists) return prev;
                    return [data, ...prev];
                });
                setSelectedResumeId(data._id); // Auto-select uploaded resume
                setUploadStatus('success');
            } else {
                console.error(data.message);
                setUploadStatus('error');
            }
        } catch (err) {
            console.error(err);
            setUploadStatus('error');
        }
    };

    const runAnalysis = async () => {
        if (!selectedResumeId) {
            alert("Please select or upload a resume first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resumeId: selectedResumeId })
            });
            const data = await res.json();
            if (res.ok) {
                setAnalysis(data.analysisResult);
                // Update specific resume in list with new data
                setResumes(prev => prev.map(r => r._id === data._id ? data : r));
            } else {
                console.error(data.message);
                alert("Analysis failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Analysis failed. Check console.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDeleteResume = async (resumeId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this resume?")) return;

        try {
            const res = await fetch(`/api/resume/${resumeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setResumes(prev => prev.filter(r => r._id !== resumeId));
                if (selectedResumeId === resumeId) {
                    setSelectedResumeId(null);
                    setAnalysis(null);
                }
            } else {
                alert("Failed to delete resume");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting resume");
        }
    };

    return (
        <div>
            <Header
                onOpenOptimizer={() => setShowOptimizer(true)}
                onOpenAdmin={() => setShowAdminPanel(true)}
                isAdmin={user?.role === 'admin' || user?.role === 'evolv_admin'}
            />

            <div style={{ padding: '0 40px 40px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Hero Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 4px 0', fontFamily: 'Inter, sans-serif' }}>Hi {user ? user.name : 'User'},</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
                            Upload your resume, run AI analysis, and explore tailored career paths.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '30px', border: '1px solid #333', background: 'transparent', color: '#fff', fontWeight: '500', transition: 'all 0.2s' }}>
                            <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept=".pdf,.docx,.txt" />
                            <Upload size={18} />
                            Upload resume
                        </label>
                        <button className="btn-primary" onClick={runAnalysis} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '30px', border: 'none', background: 'var(--color-primary)', color: '#000', fontWeight: '600' }}>
                            {isAnalyzing ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
                            Run AI analysis
                        </button>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="dashboard-grid">
                    {/* Card 1: Resume Status */}
                    <Card
                        title="Resume status"
                        isExpanded={expandedCard === 'resume'}
                        onExpand={() => handleExpand('resume')}
                        onClose={handleClose}
                        expandedContent={
                            <div style={{ color: 'white' }}>
                                <h3>Stored Resumes</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {resumes.map((r) => (
                                        <li
                                            key={r._id}
                                            onClick={(e) => handleResumeSelect(r._id, e)}
                                            style={{
                                                padding: '16px',
                                                borderBottom: '1px solid #333',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                backgroundColor: selectedResumeId === r._id ? 'rgba(212, 255, 0, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {selectedResumeId === r._id && <CheckCircle size={16} color="var(--color-primary)" />}
                                                <span style={{ fontWeight: selectedResumeId === r._id ? '600' : '400' }}>{r.originalName}</span>
                                            </div>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{new Date(r.uploadDate).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        }
                    >
                        <div style={{ color: 'var(--color-text-muted)', overflowY: 'auto', maxHeight: '150px', paddingRight: '4px' }}>
                            {resumes.length === 0 ? "No resume uploaded yet." :
                                `You have ${resumes.length} resumes stored.`}

                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {resumes.map((r) => (
                                    <div
                                        key={r._id}
                                        onClick={(e) => handleResumeSelect(r._id, e)}
                                        style={{
                                            padding: '12px',
                                            border: selectedResumeId === r._id ? '1px solid var(--color-primary)' : '1px solid #333',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: selectedResumeId === r._id ? 'rgba(212, 255, 0, 0.05)' : '#1a1a20',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            group: 'resume-card'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            {selectedResumeId === r._id && <CheckCircle size={16} color="var(--color-primary)" />}
                                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                                {r.originalName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteResume(r._id, e)}
                                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                                            title="Delete Resume"
                                        >
                                            <Trash2 size={16} className="trash-icon" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Job Readiness */}
                    <Card
                        title="Job readiness"
                        isExpanded={expandedCard === 'readiness'}
                        onExpand={() => handleExpand('readiness')}
                        onClose={handleClose}
                        expandedContent={
                            <div style={{ color: 'white' }}>
                                {analysis && (
                                    <div style={{ padding: '0 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
                                            <span style={{ fontSize: '72px', fontWeight: '800', color: 'var(--color-primary)', lineHeight: 1 }}>{analysis.readinessScore}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '20px', color: '#fff', fontWeight: 600 }}>/ 100 • {analysis.readinessLevel || 'Job Ready'}</span>
                                                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Target: {analysis.roleTarget}</span>
                                            </div>
                                        </div>

                                        <div className="progress-bar-container" style={{ height: '16px', marginBottom: '32px' }}>
                                            <div className="progress-bar" style={{ width: `${Math.min(analysis.readinessScore, 100)}%` }}></div>
                                        </div>

                                        {/* New Score Breakdown Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                                            {analysis.scoreBreakdown && Object.entries(analysis.scoreBreakdown).map(([key, value]) => (
                                                <div key={key} style={{ background: '#1a1a20', padding: '12px', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'capitalize' }}>
                                                        {key.replace(/_/g, ' ')}
                                                    </div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{value}/100</div>
                                                </div>
                                            ))}
                                            {/* Fallback for old data if needed, or just hide */}
                                            {!analysis.scoreBreakdown && (
                                                <div style={{ colSpan: 4, color: '#666' }}>Run new analysis to see details.</div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '16px', fontSize: '18px' }}>Analysis Summary</h3>
                                            <p style={{ lineHeight: '1.6', color: '#ddd', fontSize: '16px' }}>{analysis.scoreExplanation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        }
                    >
                        {analysis ? (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '56px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{analysis.readinessScore}</span>
                                    <span style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>/ 100 • {analysis.readinessLevel || 'Evaluated'}</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${Math.min(analysis.readinessScore, 100)}%` }}></div>
                                </div>

                                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {analysis.scoreBreakdown ? Object.entries(analysis.scoreBreakdown).slice(0, 4).map(([key, value]) => (
                                        <div key={key} style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                            <span style={{ color: '#fff' }}>{value}</span>
                                        </div>
                                    )) : (
                                        <span style={{ color: '#666' }}>Update Analysis</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', marginTop: '20px' }}>
                                Run AI analysis to see your readiness score and radar.
                            </div>
                        )}
                    </Card>

                    {/* Card 3: AI Insight */}
                    <Card
                        title="AI insight"
                        className="col-span-2"
                        isExpanded={expandedCard === 'insight'}
                        onExpand={() => handleExpand('insight')}
                        onClose={handleClose}
                        expandedContent={
                            <div style={{ color: 'white' }}>
                                {analysis && (
                                    <div style={{ padding: '0 20px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                            <div>
                                                <h3 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <CheckCircle size={20} /> Strengths
                                                </h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                                                    {analysis.strengths && analysis.strengths.map((s, i) => (
                                                        <span key={i} className="pill pill-green" style={{ fontSize: '14px', padding: '8px 16px' }}>{s}</span>
                                                    ))}
                                                </div>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Your profile stands out in these areas.</p>
                                            </div>

                                            <div>
                                                <h3 style={{ color: '#ff5555', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <AlertCircle size={20} /> Skill Gaps
                                                </h3>

                                                <div style={{ marginBottom: '16px' }}>
                                                    <strong style={{ color: '#ffaaaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>CRITICAL MISSING:</strong>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {analysis.skillGap?.missingCritical?.length > 0 ? analysis.skillGap.missingCritical.map((s, i) => (
                                                            <span key={i} className="pill pill-red" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255, 85, 85, 0.15)', border: '1px solid #ff5555' }}>{s}</span>
                                                        )) : <span style={{ color: '#888' }}>None detected</span>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <strong style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>SECONDARY / NICE TO HAVE:</strong>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {analysis.skillGap?.missingSecondary?.length > 0 ? analysis.skillGap.missingSecondary.map((s, i) => (
                                                            <span key={i} className="pill pill-red" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #555', color: '#ccc' }}>{s}</span>
                                                        )) : <span style={{ color: '#888' }}>None detected</span>}
                                                    </div>
                                                </div>

                                                {/* Roadmap moved to separate card */}
                                                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px dashed #444', color: '#888', textAlign: 'center', fontSize: '12px' }}>
                                                    Check "Personalized Roadmap" below for your action plan.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        }
                    >
                        {analysis ? (
                            <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#fff', marginTop: 0, fontSize: '14px', marginBottom: '12px' }}>Strengths</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {analysis.strengths && analysis.strengths.slice(0, 4).map((s, i) => (
                                            <span key={i} className="pill pill-green">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#fff', marginTop: 0, fontSize: '14px', marginBottom: '12px' }}>Gap Analysis</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {analysis.skillGap?.missingCritical?.length > 0 && (
                                            <span className="pill pill-red" style={{ border: '1px solid #ff5555' }}>{analysis.skillGap.missingCritical.length} Critical </span>
                                        )}
                                        {analysis.skillGap?.missingSecondary?.length > 0 && (
                                            <span className="pill pill-red" style={{ background: '#333', border: '1px solid #555', color: '#ccc' }}>{analysis.skillGap.missingSecondary.length} Secondary</span>
                                        )}
                                        {(!analysis.skillGap) && (
                                            <span style={{ color: '#666', fontSize: '12px' }}>Run Analysis</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', marginTop: '20px' }}>
                                Once analysis runs, you'll see strengths, gaps, and a concrete skill roadmap here.
                            </div>
                        )}
                    </Card>

                    {/* Card 4: Suggested Opportunities */}
                    <Card
                        title="Suggested opportunities"
                        className="col-span-2"
                        isExpanded={expandedCard === 'opportunities'}
                        onExpand={() => handleExpand('opportunities')}
                        onClose={handleClose}
                        expandedContent={
                            <div style={{ color: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3>Job Matches</h3>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!selectedResumeId) return;
                                            try {
                                                const btn = e.target;
                                                const originalText = btn.innerText;
                                                btn.innerText = "Refreshing...";
                                                btn.disabled = true;

                                                const res = await fetch('/api/resume/refresh-jobs', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ resumeId: selectedResumeId })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    setAnalysis(prev => ({ ...prev, suggestedOpportunities: data.analysisResult.suggestedOpportunities }));
                                                    // Update resumes list too
                                                    setResumes(prev => prev.map(r => r._id === data._id ? data : r));
                                                }
                                                btn.innerText = originalText;
                                                btn.disabled = false;
                                            } catch (err) {
                                                console.error(err);
                                                e.target.innerText = "Error";
                                            }
                                        }}
                                        style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <RefreshCw size={14} /> Refresh Jobs
                                    </button>
                                </div>
                                <div className="jobs-grid-expanded">
                                    {analysis && analysis.suggestedOpportunities.map((job, i) => (
                                        <div key={i} className="job-card">
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{job.role}</h4>
                                            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{job.company}</p>
                                            <a href={job.link} target="_blank" rel="noopener noreferrer" className="apply-link">Apply Now ↗</a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                    >
                        <div style={{ color: 'var(--color-text-muted)' }}>
                            {analysis ? "" : "Run AI analysis first. We'll suggest companies with real job links."}
                        </div>
                        {analysis && (
                            <div className="jobs-preview-row">
                                {analysis.suggestedOpportunities.slice(0, 4).map((job, i) => (
                                    <div key={i} className="job-card-mini">
                                        <div style={{ fontWeight: '600', color: 'white' }}>{job.role}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{job.company}</div>
                                        <a href={job.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>Apply ↗</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Card 5: Interactive Roadmap */}
                    <Card
                        title="Personalized roadmap"
                        className="col-span-2"
                        isExpanded={expandedCard === 'roadmap'}
                        onExpand={() => handleExpand('roadmap')}
                        onClose={handleClose}
                        expandedContent={
                            <div style={{ color: 'white' }}>
                                <div style={{ marginBottom: '20px', color: 'var(--color-text-muted)' }}>
                                    Follow these micro-steps to close your skill gaps.
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    {resumes.find(r => r._id === selectedResumeId)?.roadmapProgress?.map((item, i) => {
                                        const progressPercent = Math.round((item.microSteps.filter(s => s.isCompleted).length / item.microSteps.length) * 100) || 0;

                                        return (
                                            <div key={i} style={{
                                                background: '#1a1a20',
                                                padding: '24px',
                                                borderRadius: '16px',
                                                borderTop: item.priority === 'High' ? '4px solid #ff5555' : '4px solid orange',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <h3 style={{ margin: 0, fontSize: '20px', color: item.isCompleted ? '#888' : '#fff', textDecoration: item.isCompleted ? 'line-through' : 'none' }}>
                                                        {item.skill}
                                                    </h3>
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        color: '#ccc'
                                                    }}>
                                                        {item.timeline}
                                                    </span>
                                                </div>

                                                <p style={{ color: '#aaa', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>{item.description}</p>

                                                {/* Progress Bar */}
                                                <div style={{ height: '4px', background: '#333', borderRadius: '2px', marginTop: '8px' }}>
                                                    <div style={{ height: '100%', width: `${progressPercent}%`, background: item.isCompleted ? 'var(--color-primary)' : 'orange', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                                                </div>

                                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {item.microSteps.map((step, stepIndex) => (
                                                        <div key={stepIndex}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                // Optimistic update logic would go here, but for now we wait for server
                                                                try {
                                                                    const res = await fetch(`/api/resume/${selectedResumeId}/roadmap`, {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${token}`
                                                                        },
                                                                        body: JSON.stringify({ skill: item.skill, step: step.step })
                                                                    });
                                                                    if (res.ok) {
                                                                        const updatedProgress = await res.json();
                                                                        setResumes(prev => prev.map(r => {
                                                                            if (r._id === selectedResumeId) {
                                                                                return { ...r, roadmapProgress: updatedProgress };
                                                                            }
                                                                            return r;
                                                                        }));
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                gap: '12px',
                                                                alignItems: 'center',
                                                                padding: '8px',
                                                                background: step.isCompleted ? 'rgba(212, 255, 0, 0.05)' : 'transparent',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '18px', height: '18px',
                                                                borderRadius: '4px',
                                                                border: step.isCompleted ? 'none' : '2px solid #555',
                                                                background: step.isCompleted ? 'var(--color-primary)' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                {step.isCompleted && <CheckCircle size={12} color="black" />}
                                                            </div>
                                                            <span style={{
                                                                fontSize: '14px',
                                                                color: step.isCompleted ? '#666' : '#ddd',
                                                                textDecoration: step.isCompleted ? 'line-through' : 'none'
                                                            }}>
                                                                {step.step}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    >
                        <div style={{ color: 'var(--color-text-muted)' }}>
                            {analysis ?
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Activity size={20} color="orange" />
                                    <span>
                                        {resumes.find(r => r._id === selectedResumeId)?.roadmapProgress?.length || 0} Skills mapped.
                                        Click to see your timeline.
                                    </span>
                                </div>
                                :
                                "Run analysis to generate your detailed roadmap."
                            }
                        </div>
                    </Card>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '100px', borderTop: '1px solid #1a1a1a', paddingTop: '60px', display: 'flex', justifyContent: 'space-between', color: '#666', paddingBottom: '40px' }}>
                    <div>
                        <h3 style={{ color: '#fff', margin: '0 0 20px 0', fontSize: '24px', fontWeight: '800' }}>Evolv</h3>
                    </div>
                </footer>

                {/* AI Chat Sidebar */}
                <ChatSidebar isOpen={showOptimizer} onClose={() => setShowOptimizer(false)} />

                {/* Admin Dashboard Modal */}
                {showAdminPanel && (
                    <AdminDashboard onClose={() => setShowAdminPanel(false)} />
                )}

                {/* Admin Congratulation Popup */}
                {showAdminPopup && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1a1a20, #000)',
                            border: '2px solid var(--color-primary)',
                            padding: '40px', borderRadius: '20px', textAlign: 'center',
                            maxWidth: '500px', width: '90%'
                        }}>
                            <Shield size={64} color="var(--color-primary)" style={{ marginBottom: '20px' }} />
                            <h1 style={{ color: 'white', marginBottom: '10px' }}>Congratulations! 🎉</h1>
                            <p style={{ color: '#ccc', fontSize: '18px', lineHeight: '1.6' }}>
                                You have been promoted to an <strong>Admin</strong> by the Evolv Team.
                            </p>
                            <p style={{ color: '#888', marginBottom: '30px' }}>
                                You now have access to the Admin Panel to manage users and view activity logs.
                            </p>
                            <button
                                onClick={() => setShowAdminPopup(false)}
                                style={{
                                    background: 'var(--color-primary)', color: 'black',
                                    border: 'none', padding: '12px 30px', fontSize: '16px', fontWeight: 'bold',
                                    borderRadius: '30px', cursor: 'pointer'
                                }}
                            >
                                Awesome, let's go!
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
