
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, X, MessageSquare, Linkedin, Sparkles, Copy, Check, ChevronDown, Trash2, Clock, Save, Bookmark, Plus, ChevronLeft } from 'lucide-react';
import AuthContext from '../context/AuthContext';


const ChatSidebar = ({ isOpen, onClose }) => {
    const { token } = useContext(AuthContext);
    const [view, setView] = useState('chat'); // 'chat', 'history'
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('general'); // 'general', 'optimizer'
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [historyList, setHistoryList] = useState([]);

    const messagesEndRef = useRef(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load initial session on open
    useEffect(() => {
        if (isOpen && mode === 'general' && !sessionId) {
            loadLatestSession(); // Only load if we don't have one active
        }
    }, [isOpen, mode]);

    useEffect(() => {
        if (view === 'history') {
            fetchHistory();
        }
    }, [view]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadLatestSession = async () => {
        // Optionally load the *most recent* session
        // For now, let's start fresh or create new if none exist?
        // Actually, typically users want to pick up where they left off.
        try {
            const res = await fetch('/api/chat', { // "Get latest" endpoint
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data) {
                setSessionId(data._id);
                setIsSaved(data.isSaved);
                const displayMessages = data.messages?.filter(m => m.role !== 'system') || [];
                setMessages(displayMessages.length > 0 ? displayMessages : [{ role: 'assistant', content: "Hello! I'm Evolv AI. How can I help you today?" }]);
            } else {
                startNewChat();
            }
        } catch (err) {
            startNewChat();
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/chat/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setHistoryList(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadSession = async (id) => {
        try {
            const res = await fetch(`/api/chat/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSessionId(data._id);
                setIsSaved(data.isSaved);
                const displayMessages = data.messages.filter(m => m.role !== 'system');
                setMessages(displayMessages);
                setView('chat');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setIsSaved(false);
        setMessages([{ role: 'assistant', content: "Hello! I'm Evolv AI. How can I help you today?" }]);
        setView('chat');
    };

    const toggleSave = async (id = sessionId, currentStatus = isSaved) => {
        if (!id) return;
        try {
            const newSavedState = !currentStatus;

            const res = await fetch('/api/chat/save', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: id, isSaved: newSavedState })
            });

            if (res.ok) {
                if (id === sessionId) setIsSaved(newSavedState);
                if (view === 'history') fetchHistory(); // Refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (mode === 'general') {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ message: userMsg.content, sessionId })
                });

                const data = await res.json();
                if (res.ok) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                    if (data.session) {
                        setSessionId(data.session._id);
                        setIsSaved(data.session.isSaved); // Sync save status if new session created
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
                }

            } else if (mode === 'optimizer') {
                setMessages(prev => [...prev, { role: 'assistant', content: "Optimizing your post... ⚡" }]);

                const res = await fetch('/api/posts/optimize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content: userMsg.content })
                });

                const data = await res.json();

                if (res.ok) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs.pop();
                        return [...newMsgs, {
                            role: 'assistant',
                            content: `Here are your optimized versions:\n\n**Viral Storytelling:**\n${data.analysis.optimizedRewrites.viral_storytelling}\n\n**Professional:**\n${data.analysis.optimizedRewrites.professional_concise}\n\n**Engaging Question:**\n${data.analysis.optimizedRewrites.engaging_question}`
                        }];
                    });
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Failed to optimize post." }]);
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: isOpen ? 0 : '-400px',
            width: '400px',
            height: '100vh',
            background: '#131318',
            borderLeft: '1px solid #333',
            transition: 'right 0.3s ease-in-out',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-5px 0 30px rgba(0,0,0,0.5)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1a1a20'
            }}>
                {view === 'history' ? (
                    <button onClick={() => setView('chat')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronLeft size={20} /> Back
                    </button>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowModeDropdown(!showModeDropdown)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            {mode === 'general' ? <><MessageSquare size={18} /> Evolv Chat</> : <><Linkedin size={18} /> LinkedIn Optimizer</>}
                            <ChevronDown size={14} color="#888" />
                        </button>

                        {showModeDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '10px',
                                background: '#25252b',
                                border: '1px solid #444',
                                borderRadius: '12px',
                                width: '200px',
                                zIndex: 10,
                                overflow: 'hidden',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                            }}>
                                <div
                                    onClick={() => { setMode('general'); setShowModeDropdown(false); }}
                                    style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: mode === 'general' ? 'var(--color-primary)' : '#ccc', background: mode === 'general' ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                                >
                                    <MessageSquare size={16} /> General Assistant
                                </div>
                                <div
                                    onClick={() => { setMode('optimizer'); setShowModeDropdown(false); startNewChat(); setMode('optimizer'); }}
                                    style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: mode === 'optimizer' ? 'var(--color-primary)' : '#ccc', background: mode === 'optimizer' ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                                >
                                    <Linkedin size={16} /> Post Optimizer
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {mode === 'general' && view === 'chat' && (
                        <>
                            <button onClick={startNewChat} title="New Chat" style={{ background: 'transparent', border: '1px solid #444', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => setView('history')}
                                title="History"
                                style={{ background: 'transparent', border: '1px solid #444', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}
                            >
                                <Clock size={16} />
                            </button>
                        </>
                    )}
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {view === 'history' ? (
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    <h3 style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px' }}>Recent Sessions</h3>
                    {historyList.map(session => (
                        <div key={session._id} style={{
                            padding: '12px',
                            background: '#1a1a20',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div onClick={() => loadSession(session._id)} style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ color: '#fff', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {session.snippet}
                                </div>
                                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                                    {new Date(session.lastActivity).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleSave(session._id, session.isSaved); }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: session.isSaved ? 'var(--color-primary)' : '#444'
                                }}
                            >
                                <Bookmark size={16} fill={session.isSaved ? "currentColor" : "none"} />
                            </button>
                        </div>
                    ))}
                    {historyList.length === 0 && <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>No history found.</div>}
                </div>
            ) : (
                <>
                    {/* Retention Notice for Active Chat */}
                    {mode === 'general' && (
                        <div style={{
                            padding: '8px 16px',
                            background: isSaved ? 'rgba(212, 255, 0, 0.05)' : '#1a1a1a',
                            borderBottom: '1px solid #333',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '11px', color: isSaved ? 'var(--color-primary)' : '#666' }}>
                                {isSaved ? "Saved permanently" : "Expires in 24h"}
                            </span>
                            <button
                                onClick={() => toggleSave()}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    color: isSaved ? 'var(--color-primary)' : '#888',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} />
                                {isSaved ? "Saved" : "Save Chat"}
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                            }}>
                                <div style={{
                                    background: msg.role === 'user' ? 'var(--color-primary)' : '#25252b',
                                    color: msg.role === 'user' ? '#000' : '#ddd',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.content}
                                </div>
                                {msg.role === 'assistant' && i > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', marginLeft: '4px' }}>
                                        <button
                                            onClick={() => handleCopy(msg.content, i)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedIndex === i ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', color: '#888', fontStyle: 'italic', fontSize: '13px', marginLeft: '20px' }}>
                                Thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '20px',
                        borderTop: '1px solid #333',
                        background: '#1a1a20',
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'general' ? "Ask anything..." : "Paste your post content here..."}
                            style={{
                                flex: 1,
                                background: '#131318',
                                border: '1px solid #333',
                                borderRadius: '24px',
                                padding: '12px 20px',
                                color: 'white',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            style={{
                                background: 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px', height: '44px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Send size={18} color="black" />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatSidebar;

