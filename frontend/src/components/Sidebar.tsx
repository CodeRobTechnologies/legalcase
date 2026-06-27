import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession } from '../lib/auth';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/cases',     icon: '⚖',  label: 'Cases' },
  { to: '/hearings',  icon: '📅', label: 'Hearings' },
  { to: '/timeline',  icon: '⏳', label: 'Timeline' },
  { to: '/preparation', icon: '📋', label: 'Preparation List' },
  { to: '/clients',    icon: '👥', label: 'Client Details' },
  { to: '/documents', icon: '📄', label: 'Documents' },
  { to: '/account',   icon: '👤', label: 'Account Info' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-left">
          <span className="brand-icon">⚖</span>
          <div>
            <div className="brand-name">LegalCase</div>
            <div className="brand-tagline">Management System</div>
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">×</button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={() => { handleLogout(); onClose(); }}>
        <span>⎋</span> Logout
      </button>
    </aside>
  );
}
