import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadTeams = async () => {
    try {
      const res = await api.getMyTeams();
      setTeams(res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.createTeam({ name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      loadTeams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Manage your teams and collaborators</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Team
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <h3>No teams yet</h3>
          <p>Create your first team to start collaborating</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Team</button>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <Link to={'/teams/' + team._id} key={team._id} className="team-card">
              <div className="team-card-header">
                <div className="team-avatar">{team.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3>{team.name}</h3>
                  <p>{team.members?.length || 0} members</p>
                </div>
              </div>
              {team.description && <p className="team-desc">{team.description}</p>}
              <div className="team-card-footer">
                <span className="badge">
                  {team.members?.find((m: any) => m.role === 'OWNER') ? 'Owner' : 'Member'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Team</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Team Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering" required autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this team for?" rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}