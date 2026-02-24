import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // In a real app, you might validate the token with the backend here
            // For now, we decode it or just assume it's valid if it exists
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setToken(data.token);
            setUser(data);
            return true;
        } else {
            throw new Error(data.message);
        }
    };

    const signup = async (name, email, password, accountType = 'student') => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, accountType }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setToken(data.token);
            setUser(data);
            return true;
        } else {
            throw new Error(data.message);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error("Logout log failed", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
    };

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading, setUser: updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
