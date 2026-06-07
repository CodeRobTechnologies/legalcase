import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import './Cases.css';

type Case = {
  id: number;
  case_title: string;
  case_number?: string | null;
  case_description: string;
  case_status: string;
  lawyer_id: number | null;
  client_name?: string | null;
  client_mobile?: string | null;
};

type CaseForm = {
  case_title: string;
  case_number: string;
  case_description: string;
  lawyer_id: string;
  case_status: string;
  client_name: string;
  client_mobile: string;
};

const EMPTY: CaseForm = { case_title: '', case_number: '', case_description: '', lawyer_id: '', case_status: '', client_name: '', client_mobile: '' };

export default function Cases() {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);
  const [delCase, setDelCase] = useState<Case | null>(null);
  const [form, setForm] = useState<CaseForm>(EMPTY)
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cases/');
      setCases(res.data);
    } catch {
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for dropdown
  useEffect(() => { fetchCases(); }, []);

  const filtered = cases.filter(c => {
    const matchSearch = c.case_title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_description?.toLowerCase().includes(search.toLowerCase());
    const matchClientSearch = clientSearch ? c.client_name?.toLowerCase().includes(clientSearch.toLowerCase()) : true;
    const matchStatus = statusFilter ? c.case_status === statusFilter : true;
    return matchSearch && matchClientSearch && matchStatus;
  });

  const statusClass = (s: string) =>
    ({ Open: 'badge-open', Active: 'badge-active', Closed: 'badge-closed', Pending: 'badge-pending' }[s] ?? 'badge-open');

  const openAdd = () => { setForm(EMPTY); setFormError(''); setShowAdd(true); };
  const openEdit = (c: Case) => {
    setForm({
      case_title: c.case_title,
      case_number: c.case_number ?? '',
      case_description: c.case_description,
      lawyer_id: String(c.lawyer_id ?? ''),
      case_status: c.case_status,
      client_name: c.client_name ?? '',
      client_mobile: c.client_mobile ?? '',
    });
    setFormError(''); setEditCase(c);
  };

  const handleSave = async () => {
    if (!form.case_title.trim()) { setFormError('Title is required.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        case_title: form.case_title,
        case_description: form.case_description,
        case_number: form.case_number.trim() || null,
        lawyer_id: form.lawyer_id ? Number(form.lawyer_id) : null,
        case_status: form.case_status || 'Open',
        client_name: form.client_name.trim() || null,
        client_mobile: form.client_mobile.trim() || null,
      };
      if (editCase) {
        await api.put(`/cases/${editCase.id}`, payload);
        setEditCase(null);
      } else {
        await api.post('/cases/', payload);
        setShowAdd(false);
      }
      fetchCases();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delCase) return;
    try {
      await api.delete(`/cases/${delCase.id}`);
      setDelCase(null);
      fetchCases();
    } catch {
      alert('Failed to delete case.');
    }
  };

  return (
    <div className="cases-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-sub">{cases.length} case{cases.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" id="add-case-btn" onClick={openAdd}>+ New Case</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <input
          className="form-input search-input"
          placeholder="Search cases…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="case-search"
        />
        <input
          className="form-input search-input"
          placeholder="Search client name…"
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          id="client-search"
        />
        <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="case-status-filter">
          <option value="">All Statuses</option>
          {['Open', 'Active', 'Pending', 'Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">⚖</span>No cases found</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Case Number</th><th>Title</th><th>Description</th><th>Status</th><th>Client Name</th><th>Mobile Number</th><th>Lawyer ID</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.case_number || '—'}</td>
                  <td><strong style={{ color: 'var(--text)' }}>{c.case_title}</strong></td>
                  <td className="desc-cell">{c.case_description || '—'}</td>
                  <td><span className={`badge ${statusClass(c.case_status)}`}>{c.case_status}</span></td>
                  <td>{c.client_name || '—'}</td>
                  <td>{c.client_mobile || '—'}</td>
                  <td>{c.lawyer_id ?? '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDelCase(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAdd || editCase) && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditCase(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editCase ? 'Edit Case' : 'New Case'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.case_title} onChange={e => setForm({ ...form, case_title: e.target.value })} placeholder="Case title" />
              </div>
              <div className="form-group">
                <label className="form-label">Case Number</label>
                <input className="form-input" value={form.case_number} onChange={e => setForm({ ...form, case_number: e.target.value })} placeholder="Case number" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.case_description} onChange={e => setForm({ ...form, case_description: e.target.value })} placeholder="Case description" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Lawyer ID</label>
                <input className="form-input" type="number" value={form.lawyer_id} onChange={e => setForm({ ...form, lawyer_id: e.target.value })} placeholder="Lawyer user ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input className="form-input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" />
              </div>
              <div className="form-group">
                <label className="form-label">Client Mobile Number</label>
                <input className="form-input" value={form.client_mobile} onChange={e => setForm({ ...form, client_mobile: e.target.value })} placeholder="Client mobile number" />
              </div>
              {editCase && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.case_status} onChange={e => setForm({ ...form, case_status: e.target.value })}>
                    {['Open', 'Active', 'Pending', 'Closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditCase(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delCase && (
        <div className="modal-overlay" onClick={() => setDelCase(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h2 className="modal-title">Delete Case</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>"{delCase.case_title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDelCase(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
