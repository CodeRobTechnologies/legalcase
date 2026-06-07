import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Login    from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases    from './pages/Cases';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Timeline from './pages/Timeline';
import PreparationList from './pages/PreparationList';
import ClientDetails from './pages/ClientDetails';
import AccountInfo from './pages/AccountInfo';
import Header from './components/Header';
import api from './api/client';

// Immediately set the theme from localStorage to prevent flash
const initialTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);

function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(isAuthenticated() && !localStorage.getItem('user_id'));

  useEffect(() => {
    if (isAuthenticated() && !localStorage.getItem('user_id')) {
      api.get('/auth/me')
        .then(res => {
          localStorage.setItem('user_id', String(res.data.id));
          localStorage.setItem('user_email', res.data.email);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, []);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (loading) return <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/cases"     element={<ProtectedLayout><Cases /></ProtectedLayout>} />
        <Route path="/hearings"  element={<ProtectedLayout><Hearings /></ProtectedLayout>} />
        <Route path="/timeline"  element={<ProtectedLayout><Timeline /></ProtectedLayout>} />
        <Route path="/preparation" element={<ProtectedLayout><PreparationList /></ProtectedLayout>} />
        <Route path="/clients"    element={<ProtectedLayout><ClientDetails /></ProtectedLayout>} />
        <Route path="/account"    element={<ProtectedLayout><AccountInfo /></ProtectedLayout>} />
        <Route path="/documents" element={<ProtectedLayout><Documents /></ProtectedLayout>} />
        <Route path="/" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
