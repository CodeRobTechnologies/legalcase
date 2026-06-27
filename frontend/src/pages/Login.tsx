import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState<'assistant' | 'admin'>('assistant');
  const [email, setEmail]       = useState('lawyer@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRoleChange = (mode: 'assistant' | 'admin') => {
    setRoleMode(mode);
    if (mode === 'assistant') {
      setEmail('lawyer@example.com');
      setPassword('Password123!');
    } else {
      setEmail('admin@example.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await api.post(
        '/auth/login',
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );
      const token = res.data.access_token || res.data.token;
      if (token) {
        localStorage.setItem('token', token);
        if (res.data.user) {
          localStorage.setItem('user_id', String(res.data.user.id));
          localStorage.setItem('user_email', res.data.user.email);
          localStorage.setItem('user_role', res.data.user.role);
        }
        navigate('/dashboard');
      } else {
        setError('Token not found in response.');
      }
    } catch (err) {
      const error = err as any;
      const msg = error.response?.data?.detail;
      const errorMessage = Array.isArray(msg)
        ? msg.map((e: any) => e.msg).join(", ")
        : msg || "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-brand">
          <span className="login-icon">⚖</span>
          <h1 className="login-title">LegalCase</h1>
          <p className="login-sub">Sign in to your account</p>
        </div>

        <div className="login-role-tabs">
          <button
            type="button"
            className={`role-tab ${roleMode === 'assistant' ? 'active' : ''}`}
            onClick={() => handleRoleChange('assistant')}
          >
            Assistant Login
          </button>
          <button
            type="button"
            className={`role-tab ${roleMode === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin')}
          >
            Admin Login
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form" id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
            id="login-submit"
          >
            {loading ? <span className="spin">⟳</span> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Legal Case Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
