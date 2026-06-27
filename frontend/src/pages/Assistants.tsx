import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './Assistants.css';

type Assistant = {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
};

export default function Assistants() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: ''
  });

  const fetchAssistants = async () => {
    try {
      const res = await api.get('/auth/assistants');
      setAssistants(res.data);
    } catch (err) {
      setError('Failed to fetch assistants.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    await fetchAssistants();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/auth/register', {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        phone_number: form.phone_number.trim() || null
      });
      setShowAddModal(false);
      setForm({ full_name: '', email: '', password: '', phone_number: '' });
      fetchAssistants();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to add assistant.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssistant = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove assistant "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/auth/assistants/${id}`);
      fetchAssistants();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove assistant.');
    }
  };

  const filtered = assistants.filter(a =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="assistants-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assistant Lawyers</h1>
          <p className="page-sub">Manage assistant lawyers linked to your account</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => {
            setFormError('');
            setForm({ full_name: '', email: '', password: '', phone_number: '' });
            setShowAddModal(true);
          }}
          id="add-assistant-btn"
        >
          + Add Assistant
        </button>
      </div>

      {/* Search Filter */}
      <div className="card filter-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 250 }}>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search assistants by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Desktop & Mobile List View */}
      <div className="card assistants-list-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>No assistants found.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper desktop-table-view">
              <table>
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, index) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{index + 1}</td>
                      <td><strong style={{ color: 'var(--text)' }}>{a.full_name}</strong></td>
                      <td>{a.email}</td>
                      <td>{a.phone_number || <span className="text-dim">No phone</span>}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveAssistant(a.id, a.full_name)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view">
              {filtered.map((a, index) => (
                <div key={a.id} className="card mobile-assistant-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>S.No. {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveAssistant(a.id, a.full_name)}
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{a.full_name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>📧 {a.email}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>📞 {a.phone_number || 'No phone'}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Assistant Lawyer</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleCreateAssistant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Assistant's name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="assistant@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="123-456-7890"
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding…' : 'Add Assistant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
