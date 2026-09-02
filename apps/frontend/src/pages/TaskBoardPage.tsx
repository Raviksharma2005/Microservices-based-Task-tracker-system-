import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface StatusCol {
  key: TaskStatus;
  label: string;
  dotColor: string;
}

const COLUMNS: StatusCol[] = [
  { key: 'TODO', label: 'To Do', dotColor: '#818CF8' },
  { key: 'IN_PROGRESS', label: 'In Progress', dotColor: '#F59E0B' },
  { key: 'DONE', label: 'Completed', dotColor: '#10B981' },
];

export default function TaskBoardPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    } catch (err: any) {
      error('Failed to load board', err.message);
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
      success('Task Created', `"${title}" added to board.`);
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      error('Failed to create task', err.message);
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
      success('Status Updated', `Task moved to ${newStatus}.`);
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      success('Task Deleted', 'Task removed from board.');
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getColTasks = (status: TaskStatus) => filteredTasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="table-loading-state">
        <div className="spinner-ring" />
        <span>Loading Kanban board...</span>
      </div>
    );
  }

  return (
    <div className="view-container animate-fade-in">
      {/* Board Header */}
      <div className="board-header">
        <div>
          <div className="breadcrumb-line">
            <Link to="/teams">Teams</Link>
            <span className="sep">/</span>
            <Link to={`/teams/${teamId}`}>{team?.name}</Link>
            <span className="sep">/</span>
            <span className="current">Task Board</span>
          </div>
          <h1 className="page-main-title">{team?.name} — Kanban Board</h1>
        </div>
        <button className="btn-solid-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </button>
      </div>

      {/* Board Controls */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-stats">
          <strong>{filteredTasks.length}</strong> total tasks
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="board-columns-grid">
        {COLUMNS.map((col) => {
          const colTasks = getColTasks(col.key);
          return (
            <div className="kanban-col" key={col.key}>
              <div className="kanban-col-head">
                <div className="col-title-wrap">
                  <span className="col-dot" style={{ backgroundColor: col.dotColor }} />
                  <span className="col-title-text">{col.label}</span>
                </div>
                <span className="col-counter">{colTasks.length}</span>
              </div>

              <div className="kanban-cards-stack">
                {colTasks.map((task) => (
                  <div className="kanban-item-card animate-fade-in" key={task._id}>
                    <div className="item-card-top">
                      <span className="task-id-badge">#{task._id.substring(18)}</span>
                      <button className="icon-btn-danger-subtle" onClick={() => handleDelete(task._id)} title="Delete Task">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                    <h4 className="item-title">{task.title}</h4>
                    {task.description && <p className="item-desc">{task.description}</p>}

                    <div className="item-card-footer">
                      <select
                        className="select-status-mini"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value as TaskStatus)}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                      </select>
                      <span className="item-date">
                        {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="kanban-empty-slot">
                    <span>No tasks in this lane</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-dialog animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Create New Task</h2>
              <button className="icon-btn-ghost" onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-field">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement rate limiting on API endpoints"
                  required
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, acceptance criteria, or technical details..."
                  rows={4}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline-subtle" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-solid-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
