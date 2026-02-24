import React, { useState, useEffect, useContext } from 'react';
import { X, Users, Activity, Shield, Trash2, ArrowUp, ArrowDown, UserPlus, Copy, Check } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const AdminDashboard = ({ onClose }) => {
    const { token, user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'users', 'create'
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Create Employee State
    const [empName, setEmpName] = useState('');
    const [newEmpCreds, setNewEmpCreds] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/logs?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setLogs(data.logs);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error("Fetch logs failed", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch (error) {
            console.error("Fetch users failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (email) => {
        if (!window.confirm(`Are you sure you want to promote ${email} to Admin?`)) return;
        try {
            const res = await fetch('/api/admin/promote', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                alert("User promoted!");
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to promote user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDemote = async (email) => {
        if (!window.confirm(`Are you sure you want to demote ${email} to User?`)) return;
        try {
            const res = await fetch('/api/admin/demote', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                alert("User demoted!");
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to demote user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE ${userEmail}?\n\nThis action cannot be undone. All resumes, posts, and logs for this user will be wiped immediately.`)) return;

        try {
            const res = await fetch(`/api/admin/user/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchUsers();
            } else {
                alert(data.message || "Failed to delete user");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting user");
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/create-employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: empName })
            });
            const data = await res.json();
            if (res.ok) {
                setNewEmpCreds(data);
                setEmpName('');
            } else {
                alert(data.message || "Failed to create employee");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!newEmpCreds) return;
        const text = `Email: ${newEmpCreds.email}\nPassword: ${newEmpCreds.password}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '1000px',
                height: '80vh',
                backgroundColor: '#111116',
                borderRadius: '16px',
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a20' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={24} color="var(--color-primary)" />
                        <h2 style={{ margin: 0, color: 'white' }}>Admin Panel</h2>
                        <span style={{ fontSize: '12px', background: '#333', padding: '4px 8px', borderRadius: '4px', color: '#aaa' }}>
                            Hello, {user.name} ({user.role === 'evolv_admin' ? 'Super Admin' : 'Admin'})
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button
                        onClick={() => setActiveTab('logs')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'logs' ? '#1a1a20' : 'transparent',
                            color: activeTab === 'logs' ? 'var(--color-primary)' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'logs' ? '2px solid var(--color-primary)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                    >
                        <Activity size={18} /> Activity Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'users' ? '#1a1a20' : 'transparent',
                            color: activeTab === 'users' ? 'var(--color-primary)' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'users' ? '2px solid var(--color-primary)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                    >
                        <Users size={18} /> User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'create' ? '#1a1a20' : 'transparent',
                            color: activeTab === 'create' ? 'var(--color-primary)' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'create' ? '2px solid var(--color-primary)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                    >
                        <UserPlus size={18} /> Create Employee
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {loading && <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading...</div>}

                    {!loading && activeTab === 'logs' && (
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>Time</th>
                                        <th style={{ padding: '12px' }}>User</th>
                                        <th style={{ padding: '12px' }}>Action</th>
                                        <th style={{ padding: '12px' }}>Details</th>
                                        <th style={{ padding: '12px' }}>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log._id} style={{ borderBottom: '1px solid #222' }}>
                                            <td style={{ padding: '12px', color: '#888' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px' }}>{log.userName}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                                    background: log.action.includes('DELETE') ? 'rgba(255, 50, 50, 0.1)' : 'rgba(212, 255, 0, 0.1)',
                                                    color: log.action.includes('DELETE') ? '#ff5555' : 'var(--color-primary)'
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#aaa' }}>
                                                {JSON.stringify(log.details)}
                                            </td>
                                            <td style={{ padding: '12px', color: '#666' }}>{log.ip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && activeTab === 'users' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>Email</th>
                                    <th style={{ padding: '12px' }}>Role</th>
                                    <th style={{ padding: '12px' }}>Joined</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '12px' }}>{u.name}</td>
                                        <td style={{ padding: '12px', color: '#aaa' }}>{u.email}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                background: u.role === 'user' ? '#333' : 'var(--color-primary)',
                                                color: u.role === 'user' ? '#fff' : '#000',
                                                fontWeight: '600'
                                            }}>
                                                {u.role.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#666' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {user.role === 'evolv_admin' && u.role !== 'evolv_admin' && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    {u.role === 'user' ? (
                                                        u.email.startsWith('evolv_') && (
                                                            <button
                                                                onClick={() => handlePromote(u.email)}
                                                                title="Promote to Admin"
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: 'rgba(212, 255, 0, 0.1)',
                                                                    color: 'var(--color-primary)',
                                                                    border: '1px solid var(--color-primary)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                                }}
                                                            >
                                                                <ArrowUp size={14} /> Promote
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDemote(u.email)}
                                                            style={{ padding: '6px 12px', background: 'rgba(255, 50, 50, 0.1)', color: '#ff5555', border: '1px solid #ff5555', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <ArrowDown size={14} /> Demote
                                                        </button>
                                                    )}

                                                    {/* Delete Button (Trash) */}
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id, u.email)}
                                                        title="Permanently Delete User"
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(255, 50, 50, 0.1)',
                                                            color: '#ff5555',
                                                            border: '1px solid #ff5555',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && activeTab === 'create' && (
                        <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
                            <h3 style={{ color: 'white', marginBottom: '20px' }}>Generate Employee Credentials</h3>

                            {!newEmpCreds ? (
                                <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <label style={{ color: '#888', fontSize: '14px', marginBottom: '8px', display: 'block' }}>First Name</label>
                                        <input
                                            type="text"
                                            value={empName}
                                            onChange={(e) => setEmpName(e.target.value)}
                                            placeholder="e.g. John"
                                            required
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333',
                                                background: '#222', color: 'white', outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'var(--color-primary)', color: 'black', padding: '12px', borderRadius: '30px',
                                            border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
                                        }}
                                    >
                                        Generate Account
                                    </button>
                                </form>
                            ) : (
                                <div style={{ background: '#222', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-primary)' }}>
                                    <h4 style={{ color: 'var(--color-primary)', marginTop: 0 }}>Employee Created! 🎉</h4>
                                    <div style={{ textAlign: 'left', background: '#111', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ color: '#888', fontSize: '12px' }}>EMAIL</span>
                                            <div style={{ color: 'white', fontWeight: 'bold' }}>{newEmpCreds.email}</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#888', fontSize: '12px' }}>PASSWORD</span>
                                            <div style={{ color: 'white', fontWeight: 'bold', fontFamily: 'monospace' }}>{newEmpCreds.password}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        style={{
                                            width: '100%', background: copied ? '#4caf50' : '#333', color: 'white',
                                            padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? "Copied!" : "Copy Credentials"}
                                    </button>
                                    <button
                                        onClick={() => setNewEmpCreds(null)}
                                        style={{ marginTop: '16px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Create Another
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
