import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <h1>TalentFlow</h1>
            <span className="brand-subtitle">Hiring Platform</span>
          </Link>
        </div>
        <div className="navbar-nav">
          <Link 
            to="/jobs" 
            className={`nav-link ${isActiveRoute('/jobs') ? 'active' : ''}`}
          >
            Jobs
          </Link>
          <Link 
            to="/candidates" 
            className={`nav-link ${isActiveRoute('/candidates') ? 'active' : ''}`}
          >
            Candidates
          </Link>
          <Link 
            to="/jobs/1/assessments/new/builder" 
            className={`nav-link ${isActiveRoute('/assessments') ? 'active' : ''}`}
          >
            Assessments
          </Link>
        </div>
      </nav>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
