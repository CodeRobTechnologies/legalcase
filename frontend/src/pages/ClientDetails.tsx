import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './ClientDetails.css';

type Client = {
  id?: number;
  client_name: string;
  mobile_number?: string | null;
};

type CaseWithClient = {
  id: number;
  case_title: string;
  case_number?: string | null;
  client_name?: string | null;
  client_mobile?: string | null;
  clients?: Client[];
};

export default function ClientDetails() {
  const [cases, setCases] = useState<CaseWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchCasesWithClients = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await api.get('/cases/');
      setCases(res.data);
    } catch {
      setError('Failed to load client details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesWithClients();
  }, []);

  const handleGoToCase = (caseTitle: string) => {
    navigate(`/cases?search=${encodeURIComponent(caseTitle)}`);
  };

  // Flatten cases to client-case mappings
  const clientCaseMappings = cases.reduce((acc, c) => {
    if (c.clients && c.clients.length > 0) {
      c.clients.forEach(cl => {
        acc.push({
          id: `${c.id}-${cl.id || Math.random()}`,
          client_name: cl.client_name,
          client_mobile: cl.mobile_number || '—',
          case_number: c.case_number || '—',
          case_title: c.case_title,
        });
      });
    } else if (c.client_name) {
      acc.push({
        id: `${c.id}-legacy`,
        client_name: c.client_name,
        client_mobile: c.client_mobile || '—',
        case_number: c.case_number || '—',
        case_title: c.case_title,
      });
    }
    return acc;
  }, [] as { id: string; client_name: string; client_mobile: string; case_number: string; case_title: string }[]);

  // Filter list by client name, mobile, case title, or case number
  const filteredClients = clientCaseMappings.filter(item => {
    const query = search.toLowerCase();
    return (
      item.client_name.toLowerCase().includes(query) ||
      item.client_mobile.toLowerCase().includes(query) ||
      item.case_title.toLowerCase().includes(query) ||
      item.case_number.toLowerCase().includes(query)
    );
  });

  return (
    <div className="client-details-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Details</h1>
          <p className="page-sub">View directory of active clients and their associated cases</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Search Bar */}
      <div className="filters" style={{ marginBottom: 20 }}>
        <input
          className="form-input search-input"
          placeholder="Search by client name, phone number, case number or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>{search ? 'No matching clients found.' : 'No client details available.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Phone Number</th>
                <th>Case Number</th>
                <th>Case Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => (
                <tr key={c.id}>
                  <td><strong style={{ color: 'var(--text)' }}>{c.client_name || '—'}</strong></td>
                  <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{c.client_mobile || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{c.case_number || '—'}</td>
                  <td>{c.case_title}</td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleGoToCase(c.case_title)}
                    >
                      👁 Go to Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
