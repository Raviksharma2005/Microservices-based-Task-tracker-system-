import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getMyTeams();
        setTeams(res.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} ðŸ‘‹</h1>
          <p className="page-subtitle">Here's an overview of your workspace</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teams">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{teams.length}</span>
            <span className="stat-label">Teams</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon members">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{teams.reduce((sum, t) => sum + (t.members?.length || 0), 0)}</span>
            <span className="stat-label">Total Members</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon role">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{user?.role}</span>
            <span className="stat-label">Your Role</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Your Teams</h2>
          <Link to="/teams" className="btn btn-secondary btn-sm">View All</Link>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <h3>No teams yet</h3>
            <p>Create your first team to get started</p>
            <Link to="/teams" className="btn btn-primary">Create Team</Link>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.slice(0, 6).map((team) => (
              <Link to={'/teams/' + team._id} key={team._id} className="team-card">
                <div className="team-card-header">
                  <div className="team-avatar">{team.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3>{team.name}</h3>
                    <p>{team.members?.length || 0} members</p>
                  </div>
                </div>
                {team.description && <p className="team-desc">{team.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}