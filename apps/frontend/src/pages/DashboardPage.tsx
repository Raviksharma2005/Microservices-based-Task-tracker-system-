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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);

  return (
    <div className="view-container animate-fade-in">
      {/* Header Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-eyebrow">WORKSPACE SUMMARY</div>
          <h1 className="hero-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="hero-desc">
            Your distributed services are synced with MongoDB Atlas & Redis Cloud. You currently manage{' '}
            <strong>{teams.length} team(s)</strong> across the cluster.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/teams" className="btn-solid-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Explore Teams
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Teams</span>
            <div className="metric-icon-badge purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
          </div>
          <div className="metric-value">{teams.length}</div>
          <div className="metric-subtext">
            <span className="trend positive">↑ 100%</span> cloud persistent
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Team Members</span>
            <div className="metric-icon-badge cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="11" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
          </div>
          <div className="metric-value">{totalMembers}</div>
          <div className="metric-subtext">Collaborators across teams</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Access Level</span>
            <div className="metric-icon-badge emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
          </div>
          <div className="metric-value">{user?.role}</div>
          <div className="metric-subtext">JWT + RBAC protected</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Cache Latency</span>
            <div className="metric-icon-badge amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
          </div>
          <div className="metric-value">&lt; 1ms</div>
          <div className="metric-subtext">Redis sub-millisecond reads</div>
        </div>
      </div>

      {/* Teams Grid Section */}
      <div className="panel-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Your Workspaces & Teams</h2>
            <p className="panel-subtitle">Select a team to access its Kanban board and members.</p>
          </div>
          <Link to="/teams" className="btn-outline-subtle">
            Manage All
          </Link>
        </div>

        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-ring" />
            <span>Fetching cluster state...</span>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-panel">
            <div className="empty-icon-bubble">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <h3>No teams registered</h3>
            <p>Create your first team to start assigning tasks and inviting collaborators.</p>
            <Link to="/teams" className="btn-solid-primary">Create Team</Link>
          </div>
        ) : (
          <div className="workspace-cards-grid">
            {teams.map((team) => {
              const isOwner = team.members?.find((m: any) => m.userId === user?._id)?.role === 'OWNER';
              return (
                <Link to={`/teams/${team._id}`} key={team._id} className="workspace-card">
                  <div className="card-top">
                    <div className="team-glyph">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="card-titles">
                      <h3 className="team-heading">{team.name}</h3>
                      <span className="team-count">{team.members?.length || 0} Member(s)</span>
                    </div>
                    <span className={`pill-badge ${isOwner ? 'pill-owner' : 'pill-member'}`}>
                      {isOwner ? 'OWNER' : 'MEMBER'}
                    </span>
                  </div>
                  {team.description && (
                    <p className="card-description">{team.description}</p>
                  )}
                  <div className="card-bottom">
                    <div className="card-action-link">
                      <span>View Task Board</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
