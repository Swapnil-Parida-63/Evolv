import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import HubPage from './pages/HubPage';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/hub" element={<PrivateRoute><HubPage /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
