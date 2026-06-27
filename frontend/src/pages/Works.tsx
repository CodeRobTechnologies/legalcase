import React, { useEffect, useState } from 'react';
import api from '../api/client';
import './Works.css';

type Work = {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  assigned_to_id: number;
  created_by_id: number;
  assigned_to_name?: string;
  created_by_name?: string;
};

type Assistant = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
};

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const userRole = localStorage.getItem('user_role') || 'lawyer';
  const isAdmin = userRole === 'admin';

  const fetchWorks = async () => {
    try {
      const res = await api.get('/works/');
      setWorks(res.data);
    } catch (err) {
      setError('Failed to fetch works.');
    }
  };

  const fetchAssistants = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/auth/assistants');
      setAssistants(res.data);
    } catch (err) {
      console.error('Failed to load assistants list:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchWorks(), fetchAssistants()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAssignedTo) {
      setFormError('Title and Assignee are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        assigned_to_id: Number(newAssignedTo)
      };
      await api.post('/works/', payload);
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewAssignedTo('');
      fetchWorks();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to assign work.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (workId: number, currentStatus: string) => {
    // Rotate status: Pending -> In Progress -> Completed -> Pending
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';

    try {
      await api.put(`/works/${workId}`, { status: nextStatus });
      fetchWorks();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteWork = async (workId: number) => {
    if (!window.confirm('Are you sure you want to delete this work assignment?')) return;
    try {
      await api.delete(`/works/${workId}`);
      fetchWorks();
    } catch (err) {
      console.error('Failed to delete work:', err);
    }
  };

  if (loading) return <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="works-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Works Assigned</h1>
          <p className="page-sub">
            {isAdmin 
              ? 'Assign and track tasks given to your assistant lawyers' 
              : 'Tasks assigned to you by the admin lawyer'}
          </p>
        </div>
        {isAdmin && (
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="assign-work-btn"
          >
            + Assign Work
          </button>
        )}
      </div>

      <div className="works-list card">
        {works.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💼</span>
            <p>No works assigned yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Task</th>
                  <th>Description</th>
                  <th>Assigned {isAdmin ? 'To' : 'By'}</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {works.map((w, index) => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{index + 1}</td>
                    <td>
                      <div className="work-title-cell">
                        <strong>{w.title}</strong>
                      </div>
                    </td>
                    <td className="work-desc-cell">{w.description || <span className="text-dim">No description</span>}</td>
                    <td>{isAdmin ? w.assigned_to_name : w.created_by_name}</td>
                    <td>{w.due_date ? new Date(w.due_date).toLocaleString() : <span className="text-dim">No deadline</span>}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-toggle-btn badge ${
                          w.status === 'Completed' 
                            ? 'badge-open' 
                            : w.status === 'In Progress' 
                              ? 'badge-active' 
                              : 'badge-pending'
                        }`}
                        onClick={() => handleUpdateStatus(w.id, w.status)}
                        title="Click to cycle status"
                      >
                        {w.status}
                      </button>
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteWork(w.id)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Assign New Work</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleCreateWork} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="work-title">Task Title *</label>
                <input
                  id="work-title"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="work-desc">Description</label>
                <textarea
                  id="work-desc"
                  className="form-input"
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide instructions..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="work-due">Due Date</label>
                <input
                  id="work-due"
                  type="datetime-local"
                  className="form-input"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="work-assignee">Assign To (Assistant Lawyer) *</label>
                <select
                  id="work-assignee"
                  className="form-input"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  required
                >
                  <option value="">Select Assistant</option>
                  {assistants.map((ast) => (
                    <option key={ast.id} value={ast.id}>
                      {ast.full_name} ({ast.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
