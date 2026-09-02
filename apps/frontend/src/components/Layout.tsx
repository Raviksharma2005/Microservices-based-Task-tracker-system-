import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [clusterHealth, setClusterHealth] = useState<'healthy' | 'checking' | 'degraded'>('healthy');

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setClusterHealth('healthy');
        else setClusterHealth('degraded');
      } catch {
        setClusterHealth('degraded');
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    info('Logged out', 'You have been safely signed out.');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-top">
          <div className="workspace-header">
            <div className="workspace-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="workspace-meta">
              <span className="workspace-name">TaskFlow</span>
              <span className="workspace-env">Enterprise Cloud</span>
            </div>
          </div>
        </div>

        <nav className="nav-section">
          <div className="nav-group-label">WORKSPACE</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            <span>Overview</span>
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <span>Teams & Projects</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Account Settings</span>
          </NavLink>
        </nav>

        {/* Live Infrastructure Status */}
        <div className="sidebar-middle">
          <div className="cloud-status-card">
            <div className="status-header">
              <div className="status-indicator">
                <span className={`status-dot ${clusterHealth === 'healthy' ? 'online' : 'warn'}`} />
                <span className="status-text">Microservices Cluster</span>
              </div>
              <span className="status-ping">12ms</span>
            </div>
            <div className="infra-pills">
              <span className="infra-pill">🍃 Atlas</span>
              <span className="infra-pill">⚡ Redis</span>
              <span className="infra-pill">🛡️ Gateway</span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="sidebar-bottom">
          <div className="user-profile-menu">
            <div className="user-avatar-pill">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-profile-info">
              <span className="user-name-label">{user?.name}</span>
              <span className="user-role-label">{user?.role}</span>
            </div>
            <button className="icon-btn-ghost" onClick={handleLogout} title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="route-crumb">
              {location.pathname === '/dashboard' && 'Dashboard Overview'}
              {location.pathname.startsWith('/teams') && 'Team Management'}
              {location.pathname === '/profile' && 'User Preferences'}
            </span>
          </div>
          <div className="topbar-right">
            <div className="quick-badge">
              <kbd>⌘</kbd><kbd>K</kbd> Quick Action
            </div>
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
