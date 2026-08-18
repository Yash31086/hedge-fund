import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="text-gradient">BLACKBUSER</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Secure Investor Portal</p>
        </div>

        {error && (
          <div style={{
            color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem',
            padding: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              id="login-email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              id="login-password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Protected by BLACKBUSER Quantitative Fund
        </div>
      </div>
    </div>
  );
};

export default Login;
