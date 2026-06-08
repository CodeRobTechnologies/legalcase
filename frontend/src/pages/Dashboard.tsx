import { useEffect, useState } from 'react';
import api from '../api/client';
import './Dashboard.css';

type Analytics = {
  total_cases: number;
  active_cases: number;
  closed_cases: number;
  pending_cases: number;
  total_hearings: number;
  upcoming_hearings: number;
  total_documents: number;
  success_rate: number;
};

type RecentCase = { id: number; title: string; case_number?: string | null; status: string; lawyer_id: number | null };

type TodoTask = {
  id: string;
  title: string;
  starred: boolean;
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

type HearingForm = {
  case_id: string;
  hearing_date: string;
  location: string;
  status: string;
};

const EMPTY_HEARING: HearingForm = { case_id: '', hearing_date: '', location: '', status: 'Scheduled' };

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [cases, setCases] = useState<{ id: number; case_title: string; case_number?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CaseForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [showSchedule, setShowSchedule] = useState(false);
  const [hearingForm, setHearingForm] = useState<HearingForm>(EMPTY_HEARING);
  const [hearingSaving, setHearingSaving] = useState(false);
  const [hearingFormError, setHearingFormError] = useState('');
  const [caseSearch, setCaseSearch] = useState('');

  // Today's To Do State
  const userId = localStorage.getItem('user_id') || 'default';
  const todoKey = `todo_tasks_${userId}`;

  const [todoTasks, setTodoTasks] = useState<TodoTask[]>(() => {
    const saved = localStorage.getItem(todoKey);
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Prepare case brief for case #102', starred: true },
      { id: '2', title: 'Call client regarding new evidence', starred: false },
      { id: '3', title: 'Schedule court hearing for next Monday', starred: true },
      { id: '4', title: 'Submit document filings', starred: false }
    ];
  });
  const [showOnlyStarred, setShowOnlyStarred] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    localStorage.setItem(todoKey, JSON.stringify(todoTasks));
  }, [todoTasks, todoKey]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: TodoTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      starred: false,
    };
    setTodoTasks([...todoTasks, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleToggleStar = (taskId: string) => {
    setTodoTasks(todoTasks.map(t => t.id === taskId ? { ...t, starred: !t.starred } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTodoTasks(todoTasks.filter(t => t.id !== taskId));
  };

  const fetchDashboardData = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [dashRes, casesRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/cases/')
      ]);
      setAnalytics(dashRes.data.analytics);
      setRecentCases(dashRes.data.recent_cases);
      setCases(casesRes.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openAdd = () => { setForm(EMPTY); setFormError(''); setShowAdd(true); };
  const openSchedule = () => { setHearingForm(EMPTY_HEARING); setHearingFormError(''); setCaseSearch(''); setShowSchedule(true); };

  const handleSaveHearing = async () => {
    if (!hearingForm.case_id || !hearingForm.hearing_date || !hearingForm.location) {
      setHearingFormError('All fields are required.');
      return;
    }
    setHearingSaving(true); setHearingFormError('');
    try {
      const payload = {
        case_id: Number(hearingForm.case_id),
        hearing_date: hearingForm.hearing_date,
        location: hearingForm.location,
        status: hearingForm.status
      };
      await api.post('/hearings/', payload);
      setShowSchedule(false);
      fetchDashboardData();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setHearingFormError(error.response?.data?.detail || 'Failed to save hearing.');
    } finally {
      setHearingSaving(false);
    }
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
      await api.post('/cases/', payload);
      setShowAdd(false);
      fetchDashboardData();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state"><span className="spin" style={{fontSize:32}}>⟳</span></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const statusClass = (s: string) =>
    ({ Open: 'badge-open', Active: 'badge-active', Closed: 'badge-closed', Pending: 'badge-pending' }[s] ?? 'badge-open');

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of your legal case management system</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <ActionCard label="Add New Case"    value="+ Case"                    icon="⚖"  color="#4f46e5" onClick={openAdd} id="add-case-btn" />
        <ActionCard label="Schedule Hearing" value="+ Hearing"                 icon="📅" color="#06b6d4" onClick={openSchedule} id="schedule-hearing-btn" />
        <StatCard label="Total Cases"      value={analytics!.total_cases}      icon="⚖"  color="#4f46e5" />
        <StatCard label="Upcoming Hearings" value={analytics!.upcoming_hearings} icon="📅" color="#06b6d4" />
      </div>

      <div className="dash-bottom">
        {/* Recent Cases */}
        <div className="card dash-section">
          <h2 className="section-title">Recent Cases</h2>
          {recentCases.length === 0
            ? <div className="empty-state"><span className="empty-icon">⚖</span>No cases yet</div>
            : (
              <div className="table-wrapper" style={{border:'none'}}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Case Number</th><th>Title</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td>{c.case_number || '—'}</td>
                        <td>{c.title}</td>
                        <td><span className={`badge ${statusClass(c.status)}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* Today's To Do */}
        <div className="card dash-section todo-section">
          <div className="todo-header">
            <h2 className="section-title" style={{ margin: 0 }}>Today's To Do</h2>
            <div className="todo-header-actions">
              <button 
                className="todo-toggle-btn"
                onClick={() => setShowOnlyStarred(!showOnlyStarred)}
              >
                {showOnlyStarred ? 'View All' : 'Show Starred'}
              </button>
              <button 
                className="todo-add-btn" 
                onClick={() => setIsAddingTask(true)}
                disabled={isAddingTask}
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Inline Add Task Form */}
          {isAddingTask && (
            <div className="todo-add-form">
              <input
                className="form-input todo-input"
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                  }
                }}
                autoFocus
              />
              <div className="todo-form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddTask}>Add</button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="todo-list-container">
            {todoTasks.filter(t => !showOnlyStarred || t.starred).length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">⭐</span>
                {showOnlyStarred ? 'No starred tasks' : 'No tasks for today'}
              </div>
            ) : (
              <ul className="todo-list">
                {todoTasks
                  .filter(t => !showOnlyStarred || t.starred)
                  .map(t => (
                    <li key={t.id} className="todo-item">
                      <button 
                        className={`todo-star-btn ${t.starred ? 'starred' : ''}`}
                        onClick={() => handleToggleStar(t.id)}
                        title={t.starred ? 'Unstar task' : 'Star task'}
                      >
                        ★
                      </button>
                      <span className="todo-title">{t.title}</span>
                      <button 
                        className="todo-delete-btn"
                        onClick={() => handleDeleteTask(t.id)}
                        title="Delete task"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Case Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Case</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  value={form.case_title}
                  onChange={e => setForm({ ...form, case_title: e.target.value })}
                  placeholder="Case title"
                  id="dashboard-new-case-title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Case Number</label>
                <input
                  className="form-input"
                  value={form.case_number}
                  onChange={e => setForm({ ...form, case_number: e.target.value })}
                  placeholder="Case number"
                  id="dashboard-new-case-number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.case_description}
                  onChange={e => setForm({ ...form, case_description: e.target.value })}
                  placeholder="Case description"
                  style={{ resize: 'vertical' }}
                  id="dashboard-new-case-desc"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lawyer ID</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.lawyer_id}
                  onChange={e => setForm({ ...form, lawyer_id: e.target.value })}
                  placeholder="Lawyer user ID"
                  id="dashboard-new-case-lawyer"
                />
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
                      id={`dashboard-new-case-client-name-${idx}`}
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
                      id={`dashboard-new-case-client-mobile-${idx}`}
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
                  id="dashboard-new-case-add-client-btn"
                >
                  + Add Client as Client {form.clients.length + 1}
                </button>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="dashboard-new-case-save">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Hearing Modal */}
      {showSchedule && (
        <div className="modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Schedule Hearing</h2>
            {hearingFormError && <div className="alert alert-error">{hearingFormError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    value={hearingForm.case_id}
                    onChange={e => setHearingForm({ ...hearingForm, case_id: e.target.value })}
                    id="dashboard-new-hearing-case-id"
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
                <input
                  className="form-input"
                  type="datetime-local"
                  value={hearingForm.hearing_date}
                  onChange={e => setHearingForm({ ...hearingForm, hearing_date: e.target.value })}
                  id="dashboard-new-hearing-date"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  className="form-input"
                  value={hearingForm.location}
                  onChange={e => setHearingForm({ ...hearingForm, location: e.target.value })}
                  placeholder="Courtroom / Address"
                  id="dashboard-new-hearing-location"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={hearingForm.status}
                  onChange={e => setHearingForm({ ...hearingForm, status: e.target.value })}
                  id="dashboard-new-hearing-status"
                >
                  {['Scheduled', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSchedule(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveHearing} disabled={hearingSaving} id="dashboard-new-hearing-save">
                {hearingSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="stat-card card" style={{ alignItems: 'center', textAlign: 'center', width: '5cm', height: '5cm' }}>
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ActionCard({ label, value, icon, color, onClick, id }: { label: string; value: string; icon: string; color: string; onClick: () => void; id: string }) {
  return (
    <button 
      className="stat-card card" 
      onClick={onClick}
      id={id}
      style={{
        cursor: 'pointer',
        textAlign: 'center',
        width: '5cm',
        height: '5cm',
        border: '1px dashed var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 6px 20px ${color}1a`;
        e.currentTarget.style.background = `${color}0b`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-value" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="stat-label" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </button>
  );
}
