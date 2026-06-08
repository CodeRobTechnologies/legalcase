import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import './Cases.css';

type Client = {
  id?: number;
  client_name: string;
  mobile_number?: string | null;
};

type Case = {
  id: number;
  case_title: string;
  case_number?: string | null;
  case_description: string;
  case_status: string;
  lawyer_id: number | null;
  client_name?: string | null;
  client_mobile?: string | null;
  clients?: Client[];
  created_at?: string;
};

type ClientForm = {
  client_name: string;
  mobile_number: string;
};

type CaseForm = {
  case_title: string;
  case_number: string;
  case_description: string;
  lawyer_id: string;
  case_status: string;
  clients: ClientForm[];
};

const EMPTY: CaseForm = {
  case_title: '',
  case_number: '',
  case_description: '',
  lawyer_id: '',
  case_status: '',
  clients: [{ client_name: '', mobile_number: '' }]
};

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

  // View Details Modal state
  const [viewCase, setViewCase] = useState<Case | null>(null);
  const [viewHearings, setViewHearings] = useState<any[]>([]);
  const [viewTimeline, setViewTimeline] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

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

  const openView = async (c: Case) => {
    setViewCase(c);
    setViewLoading(true);
    setViewError('');
    setViewHearings([]);
    setViewTimeline([]);
    try {
      const [timelineRes, hearingsRes] = await Promise.all([
        api.get(`/timeline/${c.id}`),
        api.get('/hearings/')
      ]);
      if (timelineRes.data && timelineRes.data.timeline) {
        setViewTimeline(timelineRes.data.timeline);
      }
      if (hearingsRes.data && Array.isArray(hearingsRes.data)) {
        const filteredHearings = hearingsRes.data.filter((h: any) => h.case_id === c.id);
        setViewHearings(filteredHearings);
      }
    } catch (err) {
      console.error('Failed to load case details:', err);
      setViewError('Failed to load related hearings or timeline details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Fetch clients for dropdown
  useEffect(() => { fetchCases(); }, []);

  const filtered = cases.filter(c => {
    const matchSearch = c.case_title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_description?.toLowerCase().includes(search.toLowerCase());
    const matchClientSearch = clientSearch ? (
      c.clients?.some(cl => cl.client_name.toLowerCase().includes(clientSearch.toLowerCase())) ||
      c.client_name?.toLowerCase().includes(clientSearch.toLowerCase())
    ) : true;
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
      clients: c.clients && c.clients.length > 0
        ? c.clients.map(cl => ({ client_name: cl.client_name, mobile_number: cl.mobile_number ?? '' }))
        : [{ client_name: c.client_name ?? '', mobile_number: c.client_mobile ?? '' }]
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
        clients: form.clients.filter(cl => cl.client_name.trim() !== '').map(cl => ({
          client_name: cl.client_name.trim(),
          mobile_number: cl.mobile_number.trim() || null
        }))
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
                  <td>
                    {c.clients && c.clients.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {c.clients.map((cl, i) => (
                          <span key={i} style={{ display: 'block' }}>
                            {cl.client_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      c.client_name || '—'
                    )}
                  </td>
                  <td>
                    {c.clients && c.clients.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {c.clients.map((cl, i) => (
                          <span key={i} style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13 }}>
                            {cl.mobile_number || '—'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      c.client_mobile || '—'
                    )}
                  </td>

                  <td>{c.lawyer_id ?? '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openView(c)}>View</button>
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
              {form.clients.map((client, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', margin: 0 }}>Client {idx + 1}</label>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '2px 8px', fontSize: 12 }}
                        onClick={() => {
                          const updated = form.clients.filter((_, i) => i !== idx);
                          setForm({ ...form, clients: updated });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Client Name *</label>
                    <input
                      className="form-input"
                      value={client.client_name}
                      onChange={e => {
                        const updated = [...form.clients];
                        updated[idx].client_name = e.target.value;
                        setForm({ ...form, clients: updated });
                      }}
                      placeholder={`Client ${idx + 1} name`}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Client Mobile Number</label>
                    <input
                      className="form-input"
                      value={client.mobile_number}
                      onChange={e => {
                        const updated = [...form.clients];
                        updated[idx].mobile_number = e.target.value;
                        setForm({ ...form, clients: updated });
                      }}
                      placeholder={`Client ${idx + 1} mobile number`}
                    />
                  </div>
                </div>
              ))}
              {form.clients.length < 15 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setForm({
                      ...form,
                      clients: [...form.clients, { client_name: '', mobile_number: '' }]
                    });
                  }}
                  style={{ alignSelf: 'start', marginTop: 4 }}
                >
                  + Add Client as Client {form.clients.length + 1}
                </button>
              )}

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

      {/* View Case Details Modal */}
      {viewCase && (
        <div className="modal-overlay" onClick={() => setViewCase(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {viewCase.case_title}
                  <span className={`badge ${statusClass(viewCase.case_status)}`}>{viewCase.case_status}</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Case Number: {viewCase.case_number || '—'} | ID: #{viewCase.id}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewCase(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: '4px' }}
              >
                &times;
              </button>
            </div>

            {viewError && <div className="alert alert-error" style={{ flexShrink: 0 }}>{viewError}</div>}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 4 }}>
              {viewLoading ? (
                <div className="empty-state" style={{ padding: '60px 0' }}><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>
              ) : (
                <>
                  {/* General Info & Description */}
                  <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>General Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Lawyer ID</span>
                        <strong style={{ fontSize: 14 }}>{viewCase.lawyer_id ?? '—'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Created At</span>
                        <strong style={{ fontSize: 14 }}>
                          {viewCase.created_at ? new Date(viewCase.created_at).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</span>
                      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {viewCase.case_description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Clients Section */}
                  <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Client Details</h3>
                    {viewCase.clients && viewCase.clients.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {viewCase.clients.map((cl, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < viewCase.clients!.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span style={{ fontWeight: 500 }}>{cl.client_name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{cl.mobile_number || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 500 }}>{viewCase.client_name || '—'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{viewCase.client_mobile || '—'}</span>
                      </div>
                    )}
                  </div>

                  {/* Hearings Section */}
                  <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Hearings</h3>
                    {viewHearings.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '4px 0' }}>
                        No hearings scheduled for this case.
                      </div>
                    ) : (
                      <div className="table-wrapper" style={{ border: 'none' }}>
                        <table style={{ minWidth: '100%' }}>
                          <thead>
                            <tr style={{ background: 'transparent' }}>
                              <th style={{ padding: '8px 0', fontSize: 11 }}>Date & Time</th>
                              <th style={{ padding: '8px 0', fontSize: 11 }}>Location</th>
                              <th style={{ padding: '8px 0', fontSize: 11, textAlign: 'right' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewHearings.map((h, i) => (
                              <tr key={h.id} style={{ background: 'transparent', borderBottom: i < viewHearings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <td style={{ padding: '10px 0', fontSize: 13 }}>
                                  {h.hearing_date ? new Date(h.hearing_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                </td>
                                <td style={{ padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>{h.location}</td>
                                <td style={{ padding: '10px 0', fontSize: 13, textAlign: 'right' }}>
                                  <span className={`badge ${{ Scheduled: 'badge-open', Completed: 'badge-active', Cancelled: 'badge-closed' }[h.status as string] ?? 'badge-open'}`} style={{ fontSize: 11, padding: '1px 8px' }}>
                                    {h.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Timeline Events Section */}
                  <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Timeline History</h3>
                    {viewTimeline.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '4px 0' }}>
                        No timeline history recorded.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 14, borderLeft: '2px solid var(--border)', margin: '6px 0 6px 6px' }}>
                        {viewTimeline.map((evt) => (
                          <div key={evt.id} style={{ position: 'relative' }}>
                            {/* Timeline dot */}
                            <div style={{
                              position: 'absolute',
                              left: -20,
                              top: 4,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              border: '2px solid var(--bg-card)'
                            }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <strong style={{ fontSize: 13, color: 'var(--text)' }}>{evt.title}</strong>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                {evt.created_at ? new Date(evt.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                              {evt.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: 16, flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewCase(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
