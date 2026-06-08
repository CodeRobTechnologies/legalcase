import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { isApiConfigured } from '../lib/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login-json', { email, password });
      const token = res.data.access_token || res.data.token;
      if (token) {
        sessionStorage.setItem('access_token', token);
        if (res.data.user) {
          sessionStorage.setItem('user_id', String(res.data.user.id));
          sessionStorage.setItem('user_email', res.data.user.email);
        }
        navigate('/dashboard');
      } else {
        setError('Token not found in response.');
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 405 || !isApiConfigured()) {
        setError(
          'Cannot reach the API server. Set VITE_API_URL to your Railway backend URL in Vercel, then redeploy.'
        );
      } else {
        setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      }
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

        {!isApiConfigured() && (
          <div className="alert alert-error">
            API URL is not configured. Set <code>VITE_API_URL</code> in Vercel to your Railway backend URL and redeploy.
          </div>
        )}

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
