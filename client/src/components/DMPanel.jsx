import React, { useState, useEffect, useContext, useRef } from 'react';
import { Send, X, MessageCircle, Search, ArrowLeft, Check, CheckCheck, Pencil, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Avatar = ({ user, size = 38 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #d4ff00, #00ff88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: '700', color: '#000',
        flexShrink: 0, overflow: 'hidden'
    }}>
        {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.[0]?.toUpperCase() || '?'
        }
    </div>
);

const timeAgo = (date) => {
    if (!date) return '';
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return 'now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    return new Date(date).toLocaleDateString();
};

const DMPanel = ({ isOpen, onClose, initialUser }) => {
    const { token, user } = useContext(AuthContext);
    const [view, setView] = useState('list'); // 'list' | 'chat' | 'new'
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    // Edit / Delete state for messages
    const [editMsgId, setEditMsgId] = useState(null);
    const [editText, setEditText] = useState('');
    const [hoveredMsg, setHoveredMsg] = useState(null);

    // Auto-open conversation when initialUser is supplied (e.g. clicking DM on a post)
    useEffect(() => {
        if (isOpen && initialUser?._id) {
            openConvoWith(initialUser._id);
        }
    }, [isOpen, initialUser?._id]);

    // Load conversations
    const loadConversations = async () => {
        const res = await fetch('/api/users/dm/conversations', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setConversations(await res.json());
    };

    useEffect(() => {
        if (isOpen) loadConversations();
    }, [isOpen]);

    // Load messages + poll
    const loadMessages = async (convoId) => {
        setLoadingMsgs(true);
        const res = await fetch(`/api/users/dm/${convoId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setMessages(await res.json());
        setLoadingMsgs(false);
    };

    useEffect(() => {
        if (activeConvo) {
            loadMessages(activeConvo._id);
            pollRef.current = setInterval(() => loadMessages(activeConvo._id), 3000);
        }
        return () => clearInterval(pollRef.current);
    }, [activeConvo?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Search users to start new DM
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            const res = await fetch(`/api/users/search/people?q=${encodeURIComponent(searchQuery)}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSearchResults(await res.json());
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const openConvoWith = async (userId) => {
        const res = await fetch(`/api/users/dm/${userId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const convo = await res.json();
            setActiveConvo(convo);
            setView('chat');
            setSearchQuery('');
            setSearchResults([]);
            loadConversations();
        }
    };

    const sendMessage = async () => {
        if (!text.trim() || !activeConvo) return;
        const t = text;
        setText('');
        const res = await fetch(`/api/users/dm/${activeConvo._id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: t })
        });
        if (res.ok) {
            const msg = await res.json();
            setMessages(prev => [...prev, msg]);
            loadConversations();
        }
    };

    const deleteMessage = async (msgId) => {
        const res = await fetch(`/api/users/dm/message/${msgId}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMessages(prev => prev.filter(m => m._id !== msgId));
    };

    const saveEdit = async (msgId) => {
        if (!editText.trim()) return;
        const res = await fetch(`/api/users/dm/message/${msgId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: editText })
        });
        if (res.ok) {
            const updated = await res.json();
            setMessages(prev => prev.map(m => m._id === msgId ? updated : m));
        }
        setEditMsgId(null); setEditText('');
    };

    const getOtherParticipant = (convo) =>
        convo?.participants?.find(p => p._id !== user?._id && p._id?.toString() !== user?._id?.toString());

    // Reset to list when panel closes
    useEffect(() => {
        if (!isOpen) {
            setView('list');
            setActiveConvo(null);
            setMessages([]);
            setSearchQuery('');
            clearInterval(pollRef.current);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const panelStyle = {
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
        width: '360px', height: '520px',
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden'
    };

    const headerStyle = {
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0
    };

    const other = getOtherParticipant(activeConvo);

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={headerStyle}>
                {view !== 'list' && (
                    <button onClick={() => { setView('list'); setActiveConvo(null); setMessages([]); clearInterval(pollRef.current); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '2px' }}>
                        <ArrowLeft size={18} />
                    </button>
                )}
                {view === 'list' && (
                    <>
                        <MessageCircle size={18} color="#d4ff00" />
                        <span style={{ color: '#fff', fontWeight: '700', flex: 1, fontSize: '15px' }}>Messages</span>
                        <button onClick={() => setView('new')} style={{ background: 'rgba(212,255,0,0.12)', border: 'none', borderRadius: '8px', padding: '5px 10px', color: '#d4ff00', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>+ New</button>
                    </>
                )}
                {view === 'chat' && other && (
                    <>
                        <Avatar user={other} size={32} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{other.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{other.headline || other.accountType}</div>
                        </div>
                    </>
                )}
                {view === 'new' && <span style={{ color: '#fff', fontWeight: '700', flex: 1, fontSize: '15px' }}>New Message</span>}
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={17} /></button>
            </div>

            {/* List view */}
            {view === 'list' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {conversations.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                            <MessageCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                            No conversations yet.<br />Start a new one!
                        </div>
                    )}
                    {conversations.map(convo => {
                        const other = getOtherParticipant(convo);
                        if (!other) return null;
                        const lastMsg = convo.lastMessage;
                        return (
                            <div key={convo._id} onClick={() => { setActiveConvo(convo); setView('chat'); }}
                                style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '12px', cursor: 'pointer', alignItems: 'center', transition: 'background 0.1s' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <Avatar user={other} size={40} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{other.name}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{timeAgo(convo.updatedAt)}</span>
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {lastMsg?.text || 'Start chatting...'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New message / search people */}
            {view === 'new' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px' }}>
                            <Search size={14} color="rgba(255,255,255,0.3)" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search people..." autoFocus
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {searchResults.map(u => (
                            <div key={u._id} onClick={() => openConvoWith(u._id)}
                                style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '12px', cursor: 'pointer', alignItems: 'center' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <Avatar user={u} size={38} />
                                <div>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{u.headline || u.accountType}</div>
                                </div>
                            </div>
                        ))}
                        {searchQuery && searchResults.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No users found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat view */}
            {view === 'chat' && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {loadingMsgs && messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '20px' }}>Loading...</div>
                        )}
                        {messages.map(msg => {
                            const isMe = msg.sender?._id === user?._id || msg.sender?._id?.toString() === user?._id?.toString();
                            const isHovered = hoveredMsg === msg._id;
                            const isEditing = editMsgId === msg._id;
                            return (
                                <div key={msg._id}
                                    style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px', position: 'relative' }}
                                    onMouseEnter={() => setHoveredMsg(msg._id)}
                                    onMouseLeave={() => setHoveredMsg(null)}
                                >
                                    {!isMe && <Avatar user={msg.sender} size={26} />}
                                    <div>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <input value={editText} onChange={e => setEditText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(msg._id); if (e.key === 'Escape') { setEditMsgId(null); } }}
                                                    autoFocus
                                                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(212,255,0,0.5)', borderRadius: '10px', padding: '7px 11px', color: '#fff', fontSize: '13px', outline: 'none', width: '170px' }}
                                                />
                                                <button onClick={() => saveEdit(msg._id)} style={{ background: '#d4ff00', border: 'none', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}><Check size={13} color="#000" /></button>
                                                <button onClick={() => setEditMsgId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                                <div style={{
                                                    maxWidth: '200px', padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                    background: isMe ? '#d4ff00' : 'rgba(255,255,255,0.1)',
                                                    color: isMe ? '#000' : '#fff',
                                                    fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word'
                                                }}>
                                                    {msg.text}
                                                    {msg.edited && <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '4px' }}>(edited)</span>}
                                                </div>
                                                {/* Hover action buttons for own messages */}
                                                {isMe && isHovered && (
                                                    <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                                                        <button onClick={() => { setEditMsgId(msg._id); setEditText(msg.text); }}
                                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button onClick={() => deleteMessage(msg._id)}
                                                            style={{ background: 'rgba(255,80,80,0.15)', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: 'rgba(255,100,100,0.8)', display: 'flex' }}>
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: isMe ? 'right' : 'left', marginTop: '3px' }}>
                                            {timeAgo(msg.createdAt)}
                                            {isMe && <span style={{ marginLeft: '4px' }}>{msg.read ? <CheckCheck size={10} /> : <Check size={10} />}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <input
                            value={text} onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Type a message..."
                            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 13px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                        <button onClick={sendMessage} disabled={!text.trim()} style={{ background: '#d4ff00', border: 'none', borderRadius: '10px', padding: '9px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: text.trim() ? 1 : 0.4 }}>
                            <Send size={15} color="#000" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default DMPanel;
