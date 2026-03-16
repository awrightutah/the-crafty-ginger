import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;
      navigate('/account');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form-container">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Login to your Crafty Ginger account</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="auth-switch">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          padding: 4rem 0;
          min-height: 60vh;
          display: flex;
          align-items: center;
        }
        
        .auth-form-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        
        .auth-form-container h1 {
          text-align: center;
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }
        
        .auth-subtitle {
          text-align: center;
          color: var(--color-text-light);
          margin-bottom: 2rem;
        }
        
        .error-message {
          background: #FEE2E2;
          color: var(--color-error);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .auth-form .btn {
          width: 100%;
          padding: 1rem;
          margin-top: 1rem;
        }
        
        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--color-text-light);
        }
        
        .auth-switch a {
          color: var(--color-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default Login;