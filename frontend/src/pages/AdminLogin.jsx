import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { admin, login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!loading && admin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Please enter username and password.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(form.username.trim(), form.password);
      if (result.success) navigate('/admin', { replace: true });
      else setError(result.message || 'Login failed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2237 0%, #1a3a5c 50%, #2980b9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo card */}
        <div className="text-center mb-4">
          <img src="/assets/DRTlogo.png" alt="DRT Enterprise" height="70" 
            onError={(e) => e.target.style.display='none'} />
          <h2 className="mt-3 text-white fw-bold">DRT ENTERPRISE</h2>
          <p className="text-white-50">Solar Records — Admin Portal</p>
        </div>

        <div className="drt-card">
          <div className="drt-card-header" style={{ fontSize: '1rem' }}>
            <i className="bi bi-shield-lock-fill me-2"></i>
            Admin Login
          </div>
          <div className="drt-card-body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <small>{error}</small>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="login-username" className="form-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person"></i></span>
                  <input
                    id="login-username"
                    type="text"
                    className="form-control"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="Admin username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="login-password" className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock"></i></span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Admin password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="input-group-text" style={{ cursor: 'pointer' }}
                    onClick={() => setShowPass(p => !p)}>
                    <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-solar btn w-100" disabled={submitting} id="login-btn">
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-white-50 mt-4" style={{ fontSize: '0.8rem' }}>
          <i className="bi bi-arrow-left me-1"></i>
          <a href="/" className="text-white-50">Back to Consumer Form</a>
        </p>
      </div>
    </div>
  );
}
