import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(user!._id, { name });
      success('Profile Updated', 'Your profile details and cache have been refreshed.');
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">Account Settings</h1>
          <p className="page-sub-title">Manage your profile information and system credentials.</p>
        </div>
      </div>

      <div className="profile-surface-grid">
        <div className="profile-identity-card">
          <div className="profile-avatar-jumbo">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-ident-meta">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <div className="pill-badge pill-owner" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
              {user?.role} ROLE
            </div>
          </div>
        </div>

        <div className="profile-editor-card">
          <h3 className="editor-title">Edit Profile Information</h3>
          <form onSubmit={handleSubmit} className="editor-form">
            <div className="form-field">
              <label>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Registered Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
              />
              <small style={{ color: 'var(--text-muted)' }}>Email address cannot be modified once registered.</small>
            </div>
            <div className="form-field">
              <label>Database User ID</label>
              <input
                type="text"
                value={user?._id || ''}
                disabled
              />
            </div>
            <button type="submit" className="btn-solid-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
