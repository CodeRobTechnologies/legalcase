import { useEffect, useState } from 'react';
import api from '../api/client';
import './Hearings.css';

type Hearing = {
  id: number;
  title: string;
  case_id: number;
  case_number?: string | null;
  case_title?: string | null;
  hearing_date: string;
  location: string;
  status: string;
};

type HearingForm = {
  case_id: string;
  hearing_date: string;
  location: string;
  status: string;
};

const EMPTY: HearingForm = { case_id: '', hearing_date: '', location: '', status: 'Scheduled' };

export default function Hearings() {
  const [hearings, setHearings]   = useState<Hearing[]>([]);
  const [cases, setCases]         = useState<{ id: number; case_title: string; case_number?: string | null }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [editH, setEditH]         = useState<Hearing | null>(null);
  const [delH, setDelH]           = useState<Hearing | null>(null);
  const [form, setForm]           = useState<HearingForm>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [caseSearch, setCaseSearch] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [caseNumberSearch, setCaseNumberSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getHearingsForDay = (day: Date) => {
    return hearings.filter(h => {
      if (!h.hearing_date) return false;
      const hDate = new Date(h.hearing_date);
      return hDate.getDate() === day.getDate() &&
             hDate.getMonth() === day.getMonth() &&
             hDate.getFullYear() === day.getFullYear();
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openAddForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setForm({
      case_id: '',
      hearing_date: `${year}-${month}-${day}T10:00`,
      location: '',
      status: 'Scheduled'
    });
    setFormError('');
    setCaseSearch('');
    setShowAdd(true);
  };

  const fetchHearings = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params: any = {};
      if (searchDate) params.date = searchDate;
      if (clientSearch) params.client_name = clientSearch;
      if (caseNumberSearch) params.case_number = caseNumberSearch;

      const [hearingsRes, casesRes] = await Promise.all([
        api.get('/hearings/', { params }),
        api.get('/cases/')
      ]);
      setHearings(hearingsRes.data);
      setCases(casesRes.data);
    } catch {
      setError('Failed to load hearings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHearings(); }, [searchDate, clientSearch, caseNumberSearch]);

  const openAdd  = () => { setForm(EMPTY); setFormError(''); setCaseSearch(''); setShowAdd(true); };
  const openEdit = (h: Hearing) => {
    setForm({ case_id: String(h.case_id), hearing_date: h.hearing_date?.slice(0,16) ?? '', location: h.location, status: h.status });
    setFormError(''); setCaseSearch(''); setEditH(h);
  };

  const handleSave = async () => {
    if (!form.case_id || !form.hearing_date || !form.location) { setFormError('All fields are required.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { case_id: Number(form.case_id), hearing_date: form.hearing_date, location: form.location, status: form.status };
      if (editH) {
        await api.put(`/hearings/${editH.id}`, payload);
        setEditH(null);
      } else {
        await api.post('/hearings/', payload);
        setShowAdd(false);
      }
      fetchHearings();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to save hearing.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delH) return;
    try { await api.delete(`/hearings/${delH.id}`); setDelH(null); fetchHearings(); }
    catch { alert('Failed to delete hearing.'); }
  };

  const statusClass = (s: string) => ({
    Scheduled: 'badge-active', Completed: 'badge-closed', Cancelled: 'badge-pending'
  }[s] ?? 'badge-open');

  return (
    <div className="hearings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hearings</h1>
          <p className="page-sub">{hearings.length} hearing{hearings.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-hearing-btn">+ Schedule Hearing</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* View Toggle Tabs */}
      <div className="view-tabs">
        <button 
          className={`view-tab ${viewMode === 'list' ? 'active' : ''}`} 
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={`view-tab ${viewMode === 'calendar' ? 'active' : ''}`} 
          onClick={() => setViewMode('calendar')}
        >
          Calendar View
        </button>
      </div>

      {/* Filters */}
      <div className="filters" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="date"
          className="form-input"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          id="hearing-date-search"
          title="Search by hearing date"
          style={{ flex: 1, minWidth: '150px' }}
        />
        <input
          className="form-input search-input"
          placeholder="Search client name…"
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          id="client-search"
          style={{ flex: 1, minWidth: '180px' }}
        />
        <input
          className="form-input search-input"
          placeholder="Search case number…"
          value={caseNumberSearch}
          onChange={e => setCaseNumberSearch(e.target.value)}
          id="case-number-search"
          style={{ flex: 1, minWidth: '180px' }}
        />
        {(searchDate || clientSearch || caseNumberSearch) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchDate('');
              setClientSearch('');
              setCaseNumberSearch('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><span className="spin" style={{fontSize:32}}>⟳</span></div>
      ) : viewMode === 'list' ? (
        hearings.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">📅</span>No hearings scheduled</div>
        ) : (
          <>
            <div className="table-wrapper desktop-table-view">
              <table>
                <thead>
                  <tr><th>S.No.</th><th>Case Number</th><th>Case Title</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {hearings.map((h, index) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{index + 1}</td>
                      <td>{h.case_number || '—'}</td>
                      <td><strong style={{color:'var(--text)'}}>{h.case_title || h.title}</strong></td>
                      <td style={{fontSize:13}}>{h.hearing_date ? new Date(h.hearing_date).toLocaleString() : '—'}</td>
                      <td style={{fontSize:13,color:'var(--text-muted)'}}>{h.location}</td>
                      <td><span className={`badge ${statusClass(h.status)}`}>{h.status}</span></td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(h)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDelH(h)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view">
              {hearings.map((h, index) => (
                <div key={h.id} className="card mobile-hearing-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>S.No. {index + 1}</span>
                    <span className={`badge ${statusClass(h.status)}`}>{h.status}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{h.case_title || h.title}</h3>
                    {h.case_number && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Case Number: {h.case_number}</p>
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, fontSize: 13 }}>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>Date & Time</span>
                        <strong style={{ fontWeight: 500 }}>
                          {h.hearing_date ? new Date(h.hearing_date).toLocaleString() : '—'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>Location</span>
                        <strong style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{h.location}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(h)}>Edit</button>
                    <button type="button" className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDelH(h)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="calendar-container">
          <div className="calendar-header">
            <h2 className="calendar-month-title">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="calendar-nav-buttons">
              <button className="btn btn-secondary btn-sm" onClick={prevMonth}>&lt; Prev</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
              <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Next &gt;</button>
            </div>
          </div>
          
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            
            {getDaysInMonth(currentDate).map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-day-cell empty" />;
              
              const dayHearings = getHearingsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                  onClick={() => openAddForDate(day)}
                >
                  <div className="calendar-day-header">
                    <span className="calendar-day-number">{day.getDate()}</span>
                    <button 
                      className="calendar-day-add-btn"
                      title="Schedule hearing on this day"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddForDate(day);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="calendar-day-events">
                    {dayHearings.map(h => (
                      <div 
                        key={h.id} 
                        className={`calendar-event-item ${h.status}`}
                        title={`${h.case_title || h.title} - ${h.location}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(h);
                        }}
                      >
                        {h.case_title || h.title}
                      </div>
                    ))}
                  </div>
                  <div className="calendar-day-dots">
                    {dayHearings.map(h => (
                      <span key={h.id} className={`calendar-event-dot ${h.status}`} title={`${h.case_title || h.title} - ${h.location}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editH) && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditH(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editH ? 'Edit Hearing' : 'Schedule Hearing'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group">
                <label className="form-label">Case *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter case..."
                    value={caseSearch}
                    onChange={e => setCaseSearch(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-input"
                    value={form.case_id}
                    onChange={e => setForm({...form, case_id: e.target.value})}
                    style={{ flex: 2 }}
                  >
                    <option value="">Select a Case</option>
                    {cases
                      .filter(c => {
                        const query = caseSearch.toLowerCase();
                        return c.case_title.toLowerCase().includes(query) || 
                               (c.case_number && c.case_number.toLowerCase().includes(query));
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.case_number ? `[${c.case_number}] ` : ''}{c.case_title}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input className="form-input" type="datetime-local" value={form.hearing_date} onChange={e => setForm({...form, hearing_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Courtroom / Address" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {['Scheduled','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditH(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {delH && (
        <div className="modal-overlay" onClick={() => setDelH(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:380}}>
            <h2 className="modal-title">Delete Hearing</h2>
            <p style={{color:'var(--text-muted)',fontSize:14}}>Delete hearing at <strong style={{color:'var(--text)'}}>"{delH.location}"</strong>?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDelH(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
