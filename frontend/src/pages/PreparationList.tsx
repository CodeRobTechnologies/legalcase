import { useEffect, useState } from 'react';
import api from '../api/client';
import './PreparationList.css';

type PrepItem = {
  id: string;
  case_id: number;
  case_title: string;
  case_number: string;
  details: string;
  created_at: string;
};

type CaseOption = {
  id: number;
  case_title: string;
  case_number?: string | null;
};

export default function PreparationList() {
  const userId = sessionStorage.getItem('user_id') || 'default';
  const listKey = `preparation_list_${userId}`;

  const [prepList, setPrepList] = useState<PrepItem[]>(() => {
    const saved = localStorage.getItem(listKey);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search state for main page list
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [details, setDetails] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    localStorage.setItem(listKey, JSON.stringify(prepList));
  }, [prepList, listKey]);

  const fetchCases = async () => {
    await Promise.resolve();
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

  useEffect(() => {
    fetchCases();
  }, []);

  const openAdd = () => {
    setSelectedCaseId('');
    setDetails('');
    setCaseSearch('');
    setFormError('');
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!selectedCaseId) {
      setFormError('Please select a case.');
      return;
    }
    if (!details.trim()) {
      setFormError('Please enter preparation details.');
      return;
    }
    
    const selectedCase = cases.find(c => c.id === Number(selectedCaseId));
    if (!selectedCase) {
      setFormError('Selected case not found.');
      return;
    }

    const newItem: PrepItem = {
      id: Date.now().toString(),
      case_id: selectedCase.id,
      case_title: selectedCase.case_title,
      case_number: selectedCase.case_number || 'No Case Number',
      details: details.trim(),
      created_at: new Date().toISOString()
    };

    setPrepList([newItem, ...prepList]);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this preparation item?')) {
      setPrepList(prepList.filter(item => item.id !== id));
    }
  };

  const filteredPreps = prepList.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.case_title.toLowerCase().includes(query) ||
      item.case_number.toLowerCase().includes(query) ||
      item.details.toLowerCase().includes(query)
    );
  });

  return (
    <div className="preparation-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Preparation List</h1>
          <p className="page-sub">Manage legal preparation notes, details, and checklists for trials</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New Preparation</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Search Filter */}
      <div className="filters" style={{ marginBottom: 20 }}>
        <input
          className="form-input search-input"
          placeholder="Search preparations by case title, case number, or details..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && prepList.length === 0 ? (
        <div className="empty-state"><span className="spin" style={{ fontSize: 32 }}>⟳</span></div>
      ) : filteredPreps.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>{searchQuery ? 'No matching preparations found' : 'No preparations added yet. Click "+ New Preparation" to start.'}</p>
        </div>
      ) : (
        <div className="prep-grid">
          {filteredPreps.map(item => (
            <div key={item.id} className="card prep-card">
              <div className="prep-card-header">
                <div style={{ flex: 1 }}>
                  <span className="prep-case-number">[{item.case_number}]</span>
                  <h3 className="prep-case-title">{item.case_title}</h3>
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(item.id)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Delete
                </button>
              </div>
              <div className="prep-details">{item.details}</div>
              <div className="prep-meta">
                Added on {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Preparation Details</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Select Case *</label>
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
                    value={selectedCaseId}
                    onChange={e => setSelectedCaseId(e.target.value)}
                    style={{ flex: 2 }}
                  >
                    <option value="">Select a Case</option>
                    {cases
                      .filter(c => {
                        const query = caseSearch.toLowerCase();
                        return (
                          c.case_title.toLowerCase().includes(query) ||
                          (c.case_number && c.case_number.toLowerCase().includes(query))
                        );
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
                <label className="form-label">Preparation Details *</label>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder="Enter details, trial notes, required document list, key arguments..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
