import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-card card">
        <div className="notfound-icon">⚖️</div>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-message">"Justice is still in session"</p>
        <p className="notfound-desc">
          The legal record or case file you are trying to access does not exist, has been archived, or was moved to another chamber.
        </p>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Return to Chambers
        </button>
      </div>
    </div>
  );
}
