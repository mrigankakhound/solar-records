import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('drt_admin_token');
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (res.data.success) setAdmin(res.data.admin);
          else localStorage.removeItem('drt_admin_token');
        })
        .catch(() => localStorage.removeItem('drt_admin_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    if (res.data.success) {
      localStorage.setItem('drt_admin_token', res.data.token);
      setAdmin(res.data.admin);
    }
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('drt_admin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
