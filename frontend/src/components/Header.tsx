import { useEffect, useState, useRef } from 'react';
import api from '../api/client';
import './Header.css';

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

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const [reminders, setReminders] = useState<{ id: number; title: string; date: string; location: string; hoursLeft: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchHearings = async () => {
    try {
      const res = await api.get('/hearings/');
      const allHearings: Hearing[] = res.data;
      
      const now = new Date();
      const upcomingReminders = allHearings
        .filter(h => {
          if (!h.hearing_date || h.status === 'Cancelled' || h.status === 'Completed') return false;
          const hDate = new Date(h.hearing_date);
          const timeDiff = hDate.getTime() - now.getTime();
          const hrsDiff = timeDiff / (1000 * 60 * 60);
          // 24 hours before: in future, and less than or equal to 24 hours left
          return hrsDiff > 0 && hrsDiff <= 24;
        })
        .map(h => {
          const hDate = new Date(h.hearing_date);
          const timeDiff = hDate.getTime() - now.getTime();
          const hrsDiff = Math.round(timeDiff / (1000 * 60 * 60));
          return {
            id: h.id,
            title: h.case_title || h.title,
            date: hDate.toLocaleString(),
            location: h.location,
            hoursLeft: hrsDiff === 0 ? 1 : hrsDiff
          };
        });
      
      setReminders(upcomingReminders);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  useEffect(() => {
    fetchHearings();
    // Poll every 3 minutes
    const interval = setInterval(fetchHearings, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle Navigation"
        >
          ☰
        </button>
      </div>
      
      <div className="header-right" ref={dropdownRef}>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <button 
          className="bell-button" 
          onClick={() => setShowDropdown(!showDropdown)}
          title="Hearing Reminders"
        >
          <span className="bell-icon">🔔</span>
          {reminders.length > 0 && (
            <span className="bell-badge">{reminders.length}</span>
          )}
        </button>

        {showDropdown && (
          <div className="reminder-dropdown">
            <div className="reminder-dropdown-header">
              <h3>Upcoming Hearings (24hr Reminders)</h3>
              <button className="reminder-close-btn" onClick={() => setShowDropdown(false)}>×</button>
            </div>
            
            <div className="reminder-dropdown-body">
              {reminders.length === 0 ? (
                <div className="reminder-empty-state">
                  <span>🎉</span>
                  <p>No hearings scheduled in the next 24 hours.</p>
                </div>
              ) : (
                <div className="reminder-list">
                  {reminders.map(r => (
                    <div key={r.id} className="reminder-item">
                      <div className="reminder-item-header">
                        <span className="reminder-alert-badge">⚠️ In {r.hoursLeft} hr{r.hoursLeft !== 1 ? 's' : ''}</span>
                      </div>
                      <h4 className="reminder-item-title">{r.title}</h4>
                      <p className="reminder-item-detail">📅 {r.date}</p>
                      <p className="reminder-item-detail">📍 {r.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
