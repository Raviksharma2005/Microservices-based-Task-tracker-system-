import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { success, error } = useToast();

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
    setCreating(true);
    try {
      await api.createTeam({ name, description });
      success('Team Created', `"${name}" has been created successfully.`);
      setShowModal(false);
      setName('');
      setDescription('');
      loadTeams();
    } catch (err: any) {
      error('Failed to create team', err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="view-container animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">Teams & Workspaces</h1>
          <p className="page-sub-title">Organize projects, manage role-based permissions, and invite team members.</p>
        </div>
        <button className="btn-solid-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create New Team
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-stats">
          Showing <strong>{filteredTeams.length}</strong> of <strong>{teams.length}</strong> team(s)
        </div>
      </div>

      {loading ? (
        <div className="table-loading-state">
          <div className="spinner-ring" />
          <span>Loading teams...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="empty-panel">
          <div className="empty-icon-bubble">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3>{search ? 'No matching teams found' : 'No teams created yet'}</h3>
          <p>{search ? 'Try adjusting your search criteria.' : 'Create your first team to begin.'}</p>
          {!search && (
            <button className="btn-solid-primary" onClick={() => setShowModal(true)}>Create Team</button>
          )}
        </div>
      ) : (
        <div className="workspace-cards-grid">
          {filteredTeams.map((team) => (
            <Link to={`/teams/${team._id}`} key={team._id} className="workspace-card">
              <div className="card-top">
                <div className="team-glyph">{team.name.charAt(0).toUpperCase()}</div>
                <div className="card-titles">
                  <h3 className="team-heading">{team.name}</h3>
                  <span className="team-count">{team.members?.length || 0} Member(s)</span>
                </div>
              </div>
              {team.description && <p className="card-description">{team.description}</p>}
              <div className="card-bottom">
                <div className="card-action-link">
                  <span>Enter Team Dashboard</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Create New Team</h2>
              <button className="icon-btn-ghost" onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-field">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Platform Infrastructure"
                  required
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this team responsible for?"
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline-subtle" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-solid-primary" disabled={creating}>
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
