import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import CustomerDashboard from './components/CustomerDashboard';
import ServantDashboard from './components/ServantDashboard';
import AdminPanel from './components/AdminPanel';
import { Shield, LogOut, Briefcase, UserCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Authenticate user on page load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setCheckingAuth(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Loading BuaBondhu Platform...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Premium Navbar Header */}
      <header className="navbar">
        <div className="logo-container" onClick={() => window.location.reload()}>
          <span>BuaBondhu</span>
          <span style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', color: 'var(--primary)', fontWeight: 'bold' }}>
            বুয়াবন্ধু 🤝
          </span>
        </div>

        {user && (
          <div className="nav-links">
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.85rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '0.4rem 0.8rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)' 
              }}
            >
              {user.role === 'admin' ? (
                <Shield size={14} color="#f59e0b" />
              ) : user.role === 'servant' ? (
                <Briefcase size={14} color="var(--primary)" />
              ) : (
                <UserCheck size={14} color="var(--accent-teal)" />
              )}
              <span style={{ color: 'white', fontWeight: '500' }}>
                {user.name} 
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.3rem', textTransform: 'capitalize' }}>
                  ({user.role})
                </span>
              </span>
            </div>

            <button 
              onClick={handleLogout} 
              className="btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        )}
      </header>

      {/* Main Page Layout Container */}
      <main style={{ padding: '0 2rem' }}>
        {!user ? (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        ) : user.role === 'customer' ? (
          <CustomerDashboard />
        ) : user.role === 'servant' ? (
          <ServantDashboard />
        ) : user.role === 'admin' ? (
          <AdminPanel />
        ) : (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h3>Unknown Role</h3>
            <button onClick={handleLogout} className="btn-primary" style={{ marginTop: '1rem' }}>Log Out</button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        style={{ 
          marginTop: '5rem', 
          padding: '2rem', 
          borderTop: '1px solid var(--border-color)', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)' 
        }}
      >
        <p>© 2026 BuaBondhu (বুয়াবন্ধু) Inc. Verified Maid & Domestic Servant Network in Bashundhara, Dhaka.</p>
        <p style={{ marginTop: '0.4rem', fontSize: '0.75rem' }}>
          Platform Security Secured via Cryptographic NID Ledger & Digital Agreement Checks.
        </p>
      </footer>
    </div>
  );
}
