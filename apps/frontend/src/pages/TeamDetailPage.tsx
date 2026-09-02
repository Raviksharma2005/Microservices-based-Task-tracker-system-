import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getTeam(id!);
        setTeam(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const myRole = team?.members?.find((m: any) => m.userId === user?._id)?.role;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
    try {
      await api.deleteTeam(id!);
      navigate('/teams');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!team) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/teams">Teams</Link> <span>/</span> <span>{team.name}</span>
          </div>
          <h1 className="page-title">{team.name}</h1>
          {team.description && <p className="page-subtitle">{team.description}</p>}
        </div>
        <div className="header-actions">
          <Link to={'/teams/' + id + '/tasks'} className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Task Board
          </Link>
          {myRole === 'OWNER' && (
            <button className="btn btn-danger" onClick={handleDelete}>Delete Team</button>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Members ({team.members?.length || 0})</h2>
        </div>
        <div className="members-list">
          {team.members?.map((member: any) => (
            <div className="member-row" key={member.userId}>
              <div className="member-info">
                <div className="member-avatar">{member.userId.substring(0, 2).toUpperCase()}</div>
                <div>
                  <span className="member-id">{member.userId}</span>
                  <span className={'badge badge-' + member.role.toLowerCase()}>{member.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}