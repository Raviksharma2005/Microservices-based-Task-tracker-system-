import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  const loadTeam = async () => {
    try {
      const res = await api.getTeam(id!);
      setTeam(res.data);
    } catch (err: any) {
      error('Failed to load team', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeam(); }, [id]);

  const myRole = team?.members?.find((m: any) => m.userId === user?._id)?.role;
  const isOwner = myRole === 'OWNER';
  const isAdmin = myRole === 'ADMIN' || isOwner;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team? This action is permanent and will delete all associated tasks.')) return;
    try {
      await api.deleteTeam(id!);
      success('Team Deleted', 'Team has been removed from cluster.');
      navigate('/teams');
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.addTeamMember(id!, memberUserId, memberRole);
      success('Member Added', `User has been added with role ${memberRole}.`);
      setShowAddMember(false);
      setMemberUserId('');
      loadTeam();
    } catch (err: any) {
      error('Failed to add member', err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await api.removeTeamMember(id!, targetUserId);
      success('Member Removed', 'User has been removed from the team.');
      loadTeam();
    } catch (err: any) {
      error('Failed to remove member', err.message);
    }
  };

  if (loading) {
    return (
      <div className="table-loading-state">
        <div className="spinner-ring" />
        <span>Loading team details...</span>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="view-container animate-fade-in">
      {/* Breadcrumb & Title */}
      <div className="detail-header-card">
        <div className="detail-meta">
          <div className="breadcrumb-line">
            <Link to="/teams">Teams</Link>
            <span className="sep">/</span>
            <span className="current">{team.name}</span>
          </div>
          <h1 className="detail-title">{team.name}</h1>
          {team.description && <p className="detail-desc">{team.description}</p>}
        </div>

        <div className="detail-actions">
          <Link to={`/teams/${id}/tasks`} className="btn-solid-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Open Kanban Board
          </Link>
          {isOwner && (
            <button className="btn-danger-outline" onClick={handleDelete}>
              Delete Team
            </button>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="panel-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Team Roster ({team.members?.length || 0})</h2>
            <p className="panel-subtitle">Manage member roles and team access permissions.</p>
          </div>
          {isAdmin && (
            <button className="btn-outline-subtle" onClick={() => setShowAddMember(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Member
            </button>
          )}
        </div>

        <div className="member-table-wrap">
          <table className="roster-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Role</th>
                <th>Joined At</th>
                {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {team.members?.map((m: any) => (
                <tr key={m.userId}>
                  <td>
                    <div className="user-id-cell">
                      <div className="user-avatar-small">{m.userId.substring(0, 2).toUpperCase()}</div>
                      <code className="id-code">{m.userId}</code>
                      {m.userId === user?._id && <span className="pill-you">You</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`pill-badge pill-${m.role.toLowerCase()}`}>{m.role}</span>
                  </td>
                  <td className="date-cell">
                    {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td style={{ textAlign: 'right' }}>
                      {m.role !== 'OWNER' && (
                        <button className="icon-btn-danger" onClick={() => handleRemoveMember(m.userId)} title="Remove Member">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-backdrop" onClick={() => setShowAddMember(false)}>
          <div className="modal-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add Team Member</h2>
              <button className="icon-btn-ghost" onClick={() => setShowAddMember(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="form-field">
                <label>User ID (24-char MongoDB ObjectId) *</label>
                <input
                  type="text"
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  placeholder="e.g. 507f1f77bcf86cd799439011"
                  required
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>Role *</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="MEMBER">MEMBER (Can view and update assigned tasks)</option>
                  <option value="ADMIN">ADMIN (Can manage tasks and invite members)</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline-subtle" onClick={() => setShowAddMember(false)}>Cancel</button>
                <button type="submit" className="btn-solid-primary" disabled={addingMember}>
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
