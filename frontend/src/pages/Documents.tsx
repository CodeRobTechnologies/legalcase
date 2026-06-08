import { useEffect, useState, useRef } from 'react';
import api from '../api/client';

type Doc = { id: number; case_id: number; filename: string; filepath: string; };

export default function Documents() {
  const [caseId, setCaseId]   = useState('');
  const [cases, setCases]     = useState<{ id: number; case_title: string; case_number?: string | null }[]>([]);
  const [caseSearch, setCaseSearch] = useState('');
  const [docs, setDocs]       = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [delDoc, setDelDoc]   = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/cases/')
      .then(res => setCases(res.data))
      .catch(() => setError('Failed to load cases list.'));
  }, []);

  const fetchDocs = async (id: string) => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(`/documents/${id}`);
      setDocs(res.data);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load documents.');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!caseId) { setUploadErr('Select a case first.'); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadErr('Select a PDF or DOCX file.'); return; }
    setUploading(true); setUploadErr('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/documents/${caseId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fileRef.current!.value = '';
      fetchDocs(caseId);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setUploadErr(error.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!delDoc) return;
    try {
      await api.delete(`/documents/${delDoc.id}`);
      setDelDoc(null);
      fetchDocs(caseId);
    } catch { alert('Failed to delete document.'); }
  };

  return (
    <div style={{maxWidth:900}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-sub">Browse and upload case documents</p>
        </div>
      </div>

      {/* Case lookup */}
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
          <div className="form-group" style={{flex:1,minWidth:250,display:'flex',flexDirection:'column',gap:6}}>
            <label className="form-label">Case</label>
            <div style={{display:'flex',gap:8}}>
              <input
                type="text"
                className="form-input"
                placeholder="Filter case..."
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                style={{flex:1}}
              />
              <select
                className="form-input"
                value={caseId}
                onChange={e => {
                  setCaseId(e.target.value);
                  if (e.target.value) {
                    fetchDocs(e.target.value);
                  } else {
                    setDocs([]);
                  }
                }}
                style={{flex:2}}
                id="doc-case-id"
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
          <button className="btn btn-secondary" onClick={() => fetchDocs(caseId)} disabled={!caseId}>Load Documents</button>
        </div>
      </div>

      {/* Upload */}
      {caseId && (
        <div className="card" style={{marginBottom:20}}>
          <h2 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Upload Document</h2>
          {uploadErr && <div className="alert alert-error">{uploadErr}</div>}
          <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <input ref={fileRef} type="file" accept=".pdf,.docx" className="form-input" style={{flex:1}} id="doc-file-input" />
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading} id="doc-upload-btn">
              {uploading ? 'Uploading…' : '⬆ Upload'}
            </button>
          </div>
          <p style={{fontSize:12,color:'#64748b',marginTop:8}}>Allowed: PDF, DOCX</p>
        </div>
      )}

      {error  && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state"><span className="spin" style={{fontSize:32}}>⟳</span></div>
      ) : docs.length === 0 && caseId ? (
        <div className="empty-state"><span className="empty-icon">📄</span>No documents for this case</div>
      ) : !caseId ? (
        <div className="empty-state"><span className="empty-icon">📂</span>Select a case above to view documents</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Filename</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td style={{fontFamily:'monospace',fontSize:13,color:'var(--text-muted)'}}>{d.filename}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <a
                        className="btn btn-secondary btn-sm"
                        href={`${import.meta.env.VITE_API_URL || ''}/documents/download/${d.id}?token=${sessionStorage.getItem('access_token')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        👁 Open
                      </a>
                      <button className="btn btn-danger btn-sm" onClick={() => setDelDoc(d)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {delDoc && (
        <div className="modal-overlay" onClick={() => setDelDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:380}}>
            <h2 className="modal-title">Delete Document</h2>
            <p style={{color:'var(--text-muted)',fontSize:14}}>Delete <strong style={{color:'var(--text)'}}>{delDoc.filename}</strong>?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDelDoc(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
