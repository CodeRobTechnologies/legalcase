import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './ClientDetails.css';

type Client = {
  id?: number;
  client_name: string;
  mobile_number?: string | null;
  paid_amount?: number;
};

type CaseWithClient = {
  id: number;
  case_title: string;
  case_number?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  client_mobile?: string | null;
  client_paid_amount?: number | null;
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

  const handleAdjustPayment = async (clientId: number, clientName: string, operation: 'add' | 'subtract') => {
    const word = operation === 'add' ? 'add to' : 'subtract from';
    const input = window.prompt(`Enter amount to ${word} ${clientName}'s payment sum:`);
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    
    try {
      await api.put(`/cases/clients/${clientId}/payment`, {
        amount,
        operation
      });
      fetchCasesWithClients();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to adjust payment.');
    }
  };

  // Flatten cases to client-case mappings
  const clientCaseMappings = cases.reduce((acc, c) => {
    if (c.clients && c.clients.length > 0) {
      c.clients.forEach(cl => {
        acc.push({
          id: `${c.id}-${cl.id || Math.random()}`,
          client_id: cl.id,
          client_name: cl.client_name,
          client_mobile: cl.mobile_number || '—',
          paid_amount: cl.paid_amount || 0,
          case_number: c.case_number || '—',
          case_title: c.case_title,
        });
      });
    } else if (c.client_name) {
      acc.push({
        id: `${c.id}-legacy`,
        client_id: c.client_id || undefined,
        client_name: c.client_name,
        client_mobile: c.client_mobile || '—',
        paid_amount: c.client_paid_amount || 0,
        case_number: c.case_number || '—',
        case_title: c.case_title,
      });
    }
    return acc;
  }, [] as { id: string; client_id?: number; client_name: string; client_mobile: string; paid_amount: number; case_number: string; case_title: string }[]);

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
        <>
          <div className="table-wrapper desktop-table-view">
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Phone Number</th>
                  <th>Paid Amount (Sum)</th>
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{c.paid_amount.toFixed(2)}</span>
                        {c.client_id && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px', minWidth: '24px' }}
                              onClick={() => handleAdjustPayment(c.client_id!, c.client_name, 'add')}
                              title="Add to payment"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px', minWidth: '24px' }}
                              onClick={() => handleAdjustPayment(c.client_id!, c.client_name, 'subtract')}
                              title="Deduct from payment"
                            >
                              -
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
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

          <div className="mobile-cards-view">
            {filteredClients.map(c => (
              <div key={c.id} className="card mobile-client-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{c.client_name || '—'}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>📞 {c.client_mobile || '—'}</p>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>Paid Amount</span>
                        <strong style={{ fontWeight: 600 }}>₹{c.paid_amount.toFixed(2)}</strong>
                      </div>
                      {c.client_id && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px' }}
                            onClick={() => handleAdjustPayment(c.client_id!, c.client_name, 'add')}
                          >
                            + Add
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px' }}
                            onClick={() => handleAdjustPayment(c.client_id!, c.client_name, 'subtract')}
                          >
                            - Less
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>Case Title</span>
                      <strong style={{ fontWeight: 500 }}>{c.case_title}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>Case Number</span>
                      <strong style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.case_number || '—'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleGoToCase(c.case_title)}
                  >
                    👁 Go to Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
