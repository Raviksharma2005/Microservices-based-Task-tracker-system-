import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      success('Account Created', 'Welcome to TaskFlow!');
      navigate('/dashboard');
    } catch (err: any) {
      error('Registration Failed', err.message);
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
        <h1 className="auth-headline">Create your Account</h1>
        <p className="auth-subline">Get started with full RBAC and Cloud persistence</p>

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="form-field">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ravi Sharma"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ravi@example.com"
              required
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 digit"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-solid-primary btn-full-width" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div className="auth-links-row">
          <span>Already registered?</span>
          <Link to="/login" className="auth-accent-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
