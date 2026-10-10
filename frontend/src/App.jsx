import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ConsumerForm from './pages/ConsumerForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RecordDetails from './pages/RecordDetails';
import EditRecord from './pages/EditRecord';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
  return admin ? children : <Navigate to="/admin/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<ConsumerForm />} />
      
      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/records/:id" element={<ProtectedRoute><RecordDetails /></ProtectedRoute>} />
      <Route path="/admin/records/:id/edit" element={<ProtectedRoute><EditRecord /></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/form' : '/'}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
