import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ adminMode = false }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <nav className="drt-navbar navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to={adminMode ? '/admin' : '/'}>
          <img src="/assets/DRTlogo.png" alt="DRT Enterprise Logo" 
               onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="brand-text">
            <span>DRT ENTERPRISE</span>
            <small>Solar Energy Solutions</small>
          </div>
        </Link>

        <div className="ms-auto d-flex align-items-center gap-3">
          {adminMode && admin ? (
            <>
              <Link to="/admin" className="text-white text-decoration-none d-none d-sm-block">
                <i className="bi bi-grid-3x3-gap me-1"></i>Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </>
          ) : !adminMode ? (
            <Link to="/admin/login" className="btn btn-sm btn-outline-light">
              <i className="bi bi-shield-lock me-1"></i>Admin
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
