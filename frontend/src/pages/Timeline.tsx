import { useEffect, useState } from 'react';
import api from '../api/client';
import './Timeline.css';

type TimelineEvent = {
  id: number;
  case_id: number;
  title: string;
  description: string;
  created_at: string;
};

type TimelineData = {
  case_id: number;
  case_title: string;
  case_number?: string | null;
  total_events: number;
  timeline: TimelineEvent[];
};

export default function Timeline() {
  const [caseId, setCaseId] = useState('');
  const [cases, setCases] = useState<{ id: number; case_title: string; case_number?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<TimelineData | null>(null);
  const [caseSearch, setCaseSearch] = useState('');

  useEffect(() => {
    api.get('/cases/')
      .then(res => setCases(res.data))
      .catch(() => setError('Failed to load cases list.'));
  }, []);

  const fetchTimeline = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/timeline/${id}`);
      setData(res.data);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setData(null);
      setError(error.response?.data?.detail || 'Failed to load timeline. Please check Case ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTimeline(caseId);
  };

  // Map event titles to styles/icons
  const getEventMeta = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('create') || t.includes('register')) {
      return { className: 'event-registered', icon: '⚖️', displayTitle: 'Case Registered' };
    }
    if (t.includes('reschedule') || t.includes('update')) {
      return { className: 'event-rescheduled', icon: '🔄', displayTitle: title };
    }
    if (t.includes('schedule')) {
      return { className: 'event-scheduled', icon: '📅', displayTitle: title };
    }
    if (t.includes('cancel') || t.includes('delete') || t.includes('remove')) {
      return { className: 'event-cancelled', icon: '🛑', displayTitle: title };
    }
    if (t.includes('complete')) {
      return { className: 'event-completed', icon: '✅', displayTitle: title };
    }
    return { className: '', icon: '•', displayTitle: title };
  };

  // Sort chronological (earliest first, oldest first)
  const sortedEvents = data
    ? [...data.timeline].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  return (
    <div className="timeline-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Case Timeline</h1>
          <p className="page-sub">View full case lifecycle progress and activity history</p>
        </div>
      </div>

      {/* Case search input */}
      <div className="card timeline-search-card">
        <form onSubmit={handleSearch} className="timeline-search-bar">
          <div className="timeline-search-input-group form-group">
            <label className="form-label" htmlFor="case-id-select">Case</label>
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
                id="case-id-select"
                className="form-input"
                value={caseId}
                onChange={(e) => {
                  setCaseId(e.target.value);
                  if (e.target.value) {
                    fetchTimeline(e.target.value);
                  } else {
                    setData(null);
                  }
                }}
                style={{ flex: 2 }}
              >
                <option value="">Select a Case...</option>
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
          <button type="submit" className="btn btn-primary" disabled={loading || !caseId.trim()}>
            {loading ? 'Loading...' : 'Load Timeline'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="empty-state">
          <span className="spin" style={{ fontSize: 32 }}>⟳</span>
          <p>Loading timeline history...</p>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="empty-state">
          <span className="empty-icon">⏳</span>
          <p>Select a case above to track its timeline status completely.</p>
        </div>
      )}

      {!loading && data && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Case Meta Box */}
          <div className="case-info-header">
            <div>
              <div className="case-info-meta">Case Tracking Profile</div>
              <h2 className="case-info-title">{data.case_title} {data.case_number ? `(${data.case_number})` : ''}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="case-info-meta">Logged Actions</div>
              <span className="badge badge-active" style={{ fontSize: 13, marginTop: 4 }}>
                {data.total_events} Event{data.total_events !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {sortedEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <span className="empty-icon">📁</span>
              <p>No activity has been logged for this case yet.</p>
            </div>
          ) : (
            /* Vertical connecting timeline flow */
            <div className="timeline-flow">
              {sortedEvents.map((event) => {
                const meta = getEventMeta(event.title);
                return (
                  <div key={event.id} className={`timeline-event-wrapper ${meta.className}`}>
                    <div className="timeline-event-dot">
                      <span style={{ fontSize: 12 }}>{meta.icon}</span>
                    </div>
                    <div className="timeline-event-card">
                      <div className="timeline-event-header">
                        <h3 className="timeline-event-title">{meta.displayTitle}</h3>
                        <span className="timeline-event-time">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="timeline-event-desc">{event.description.trim()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
