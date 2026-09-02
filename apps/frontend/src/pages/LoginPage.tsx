import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome back', 'Successfully authenticated.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Authentication Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen">
      <div className="auth-surface animate-fade-in">
        <div className="auth-brand-badge">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="auth-headline">Sign In to TaskFlow</h1>
        <p className="auth-subline">Microservices Architecture & Team Management API</p>

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="form-field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-solid-primary btn-full-width" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links-row">
          <span>Don't have an account?</span>
          <Link to="/register" className="auth-accent-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
