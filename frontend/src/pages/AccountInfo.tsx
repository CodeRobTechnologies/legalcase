import { useEffect, useState } from 'react';
import api from '../api/client';
import './AccountInfo.css';

type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone_number?: string | null;
};

export default function AccountInfo() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
    } catch {
      setError('Failed to load account information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="account-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Details</h1>
          <p className="page-sub">View and verify your registered lawyer account information</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>
      ) : !profile ? (
        <div className="empty-state">No profile information available.</div>
      ) : (
        <div className="profile-card">
          <div className="profile-avatar-wrapper">
            <span className="profile-avatar-icon">👤</span>
          </div>

          <div className="profile-title-group">
            <h2>{profile.full_name}</h2>
            <p style={{ textTransform: 'capitalize' }}>
              <span className="badge badge-active">{profile.role}</span>
            </p>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">User ID</span>
              <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>#{profile.id}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Email Address</span>
              <span className="profile-info-value">{profile.email}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Mobile Number</span>
              <span className="profile-info-value">{profile.phone_number || '—'}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">System Access Level</span>
              <span className="profile-info-value" style={{ textTransform: 'capitalize' }}>{profile.role}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
