import React, { useState, useContext, useEffect } from 'react';
import { X, Send, Sparkles, Copy, Check, Linkedin, History, ArrowLeft, Clock } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const OptimizerChat = ({ onClose }) => {
    const { token } = useContext(AuthContext);
    const [mode, setMode] = useState('optimize'); // 'optimize', 'create', 'history'
    const [input, setInput] = useState('');
    const [keyPoints, setKeyPoints] = useState(''); // Only for create mode
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (mode === 'history') {
            fetchHistory();
        }
    }, [mode]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/posts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setHistory(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const endpoint = mode === 'optimize' ? '/api/posts/optimize' : '/api/posts/create';
            const body = mode === 'optimize'
                ? { content: input }
                : { topic: input, keyPoints: keyPoints };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                alert(data.message || 'Error processing request');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadFromHistory = (post) => {
        setResult({
            analysis: post.analysis,
            optimizedRewrites: post.optimizedRewrites
        });
        setMode(post.type === 'scratch' ? 'create' : 'optimize');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '600px',
            backgroundColor: '#1a1a20',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#1a1a20'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0077b5, #00a0dc)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Linkedin size={18} color="white" />
                    </div>
                    <span style={{ fontWeight: '600', color: 'white' }}>Post Optimizer</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Mode Switcher */}
                <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#25252b', borderRadius: '8px' }}>
                    {mode === 'history' ? (
                        <button
                            onClick={() => { setMode('optimize'); setResult(null); }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => { setMode('optimize'); setResult(null); }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: mode === 'optimize' ? '#333' : 'transparent',
                                    color: mode === 'optimize' ? 'white' : '#888',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                Optimize
                            </button>
                            <button
                                onClick={() => { setMode('create'); setResult(null); }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: mode === 'create' ? '#333' : 'transparent',
                                    color: mode === 'create' ? 'white' : '#888',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setMode('history')}
                                style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#888',
                                    cursor: 'pointer'
                                }}
                                title="History"
                            >
                                <History size={18} />
                            </button>
                        </>
                    )}
                </div>

                {mode === 'history' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 style={{ color: 'white', margin: '0 0 8px 0' }}>Request History (12h)</h4>
                        {history.length === 0 && <p style={{ color: '#666', fontSize: '14px' }}>No recent posts found.</p>}
                        {history.map(post => (
                            <div
                                key={post._id}
                                onClick={() => loadFromHistory(post)}
                                style={{
                                    background: '#25252b',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#2a2a32'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#25252b'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                        {post.type ? post.type.toUpperCase() : 'OPTIMIZE'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={10} />
                                        {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ color: '#ccc', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {post.originalContent ? post.originalContent.substring(0, 40) + '...' : 'Generated Content'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : !result ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        {mode === 'optimize' ? (
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste your draft here..."
                                style={{
                                    flex: 1,
                                    background: '#25252b',
                                    border: '1px solid #333',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    color: 'white',
                                    resize: 'none',
                                    fontSize: '14px',
                                    lineHeight: '1.5'
                                }}
                            />
                        ) : (
                            <>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="What is the post about? (Topic)"
                                    style={{
                                        background: '#25252b',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                                <textarea
                                    value={keyPoints}
                                    onChange={(e) => setKeyPoints(e.target.value)}
                                    placeholder="Key points to include..."
                                    style={{
                                        flex: 1,
                                        background: '#25252b',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        color: 'white',
                                        resize: 'none',
                                        fontSize: '14px',
                                        lineHeight: '1.5'
                                    }}
                                />
                            </>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'black',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? (
                                <>
                                    <Sparkles className="spin" size={18} />
                                    {mode === 'optimize' ? 'Optimizing...' : 'Generating...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    {mode === 'optimize' ? 'Optimize Post' : 'Generate Post'}
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
                        {/* If Optimize Mode */}
                        {mode === 'optimize' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)' }}>
                                        {result.analysis ? result.analysis.overall_score : 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                        Overall Score<br />out of 100
                                    </div>
                                </div>

                                {/* Rewrites Tabs (simplified as list for now) */}
                                <div>
                                    <h4 style={{ color: 'white', margin: '0 0 12px 0' }}>Optimized Versions</h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {Object.entries(result.optimizedRewrites || {}).map(([key, text]) => (
                                            <div key={key} style={{ background: '#25252b', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                        {key.replace('_', ' ')}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(text)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                                                    >
                                                        {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                <p style={{ color: '#ddd', fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* If Create Mode */}
                        {mode === 'create' && (
                            <div style={{ background: '#25252b', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        Generated Post
                                    </span>
                                    <button
                                        onClick={() => handleCopy(result.optimizedRewrites.viral_storytelling)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                                    >
                                        {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <p style={{ color: '#ddd', fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {result.optimizedRewrites.viral_storytelling}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setResult(null)}
                            style={{
                                padding: '12px',
                                background: '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Start Over
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptimizerChat;
