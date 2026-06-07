import { NavLink, useNavigate } from 'react-router-dom';
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

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⚖</span>
        <div>
          <div className="brand-name">LegalCase</div>
          <div className="brand-tagline">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span>⎋</span> Logout
      </button>
    </aside>
  );
}
