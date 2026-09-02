import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: 'To Do', color: '#6366f1' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  DONE: { label: 'Done', color: '#10b981' },
};

export default function TaskBoardPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const [teamRes, tasksRes] = await Promise.all([
        api.getTeam(teamId!),
        api.getTeamTasks(teamId!),
      ]);
      setTeam(teamRes.data);
      setTasks(tasksRes.data?.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [teamId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createTask({ teamId: teamId!, title, description });
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch {}
  };

  const handleDelete = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch {}
  };

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/teams">Teams</Link> <span>/</span>
            <Link to={'/teams/' + teamId}>{team?.name}</Link> <span>/</span>
            <span>Tasks</span>
          </div>
          <h1 className="page-title">Task Board</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </button>
      </div>

      <div className="kanban-board">
        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => (
          <div className="kanban-column" key={status}>
            <div className="kanban-column-header" style={{ borderTopColor: STATUS_CONFIG[status].color }}>
              <span className="kanban-status-dot" style={{ backgroundColor: STATUS_CONFIG[status].color }} />
              <h3>{STATUS_CONFIG[status].label}</h3>
              <span className="kanban-count">{getTasksByStatus(status).length}</span>
            </div>
            <div className="kanban-cards">
              {getTasksByStatus(status).map((task) => (
                <div className="kanban-card" key={task._id}>
                  <h4>{task.title}</h4>
                  {task.description && <p>{task.description}</p>}
                  <div className="kanban-card-actions">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value as TaskStatus)}
                      className="status-select"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(task._id)} title="Delete task">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {getTasksByStatus(status).length === 0 && (
                <div className="kanban-empty">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}