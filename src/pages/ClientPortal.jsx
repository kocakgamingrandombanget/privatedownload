import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ClientPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Dummy login just to show the portal logic switch
    setTimeout(() => {
      setIsAuthenticated(true);
      setLoading(false);
    }, 1000);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-wrapper" style={{display: 'flex'}}>
        <div className="auth-container active" style={{display: 'flex'}}>
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-admin flex items-center justify-center text-white shadow-folder-orange shadow-lg">
              <i className="fa-solid fa-cube text-3xl"></i>
            </div>
          </div>
          <h1 className="font-outfit font-bold text-white mb-2 text-center">Client Portal</h1>
          <p className="text-center text-text-secondary text-sm mb-6">Enter your credentials to manage servers and licenses</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required placeholder="admin@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-master w-full mt-4 text-base py-3">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-text-muted hover:text-white transition-colors">
              <i className="fa-solid fa-arrow-left mr-1"></i> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper active" style={{display: 'flex'}}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-cube text-accent-primary text-xl"></i>
            <span className="font-outfit font-bold text-lg text-white tracking-tight">Portal</span>
          </div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item active">
            <i className="fa-solid fa-server"></i>
            <span>My Servers</span>
          </div>
          <div className="nav-item">
            <i className="fa-solid fa-key"></i>
            <span>Generate License</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="nav-item logout-btn" onClick={() => setIsAuthenticated(false)}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </div>
        </div>
      </aside>
      <main className="main-panel">
        <header className="top-header">
          <h2 className="font-outfit text-white font-bold m-0">Dashboard</h2>
          <div className="user-profile-mini">
            <span className="text-sm font-medium text-text-secondary">Pro User</span>
            <div className="avatar-mini">PU</div>
          </div>
        </header>
        <div className="content-body">
          <div className="tab-content active">
            <h2 className="section-title">
              <i className="fa-solid fa-server text-accent-primary"></i> Servers
            </h2>
            <div className="stat-card">
               <h3 className="font-outfit text-xl text-white font-bold">No servers connected</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
