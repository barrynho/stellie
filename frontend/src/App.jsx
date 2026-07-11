import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateContract from './pages/CreateContract';
import SignContract from './pages/SignContract';
import ContractDetails from './pages/ContractDetails';
import { Heart } from 'lucide-react';
import './App.css';

const PublicOnlyRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="card-icon" style={{ animation: 'pulse 1.5s infinite', marginBottom: '1rem' }}>
          <Heart size={32} fill="currentColor" />
        </div>
        <p>Vérification de la session...</p>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="card-icon" style={{ animation: 'pulse 1.5s infinite', marginBottom: '1rem' }}>
          <Heart size={32} fill="currentColor" />
        </div>
        <p>Vérification de la session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Navbar Component
const Navbar = () => {
  const { token, logout, user } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Heart size={24} fill="currentColor" style={{ color: 'var(--accent-rose)' }} />
        Love Contract
      </Link>
      {token && user && (
        <ul className="nav-links">
          <li className="nav-user">
            Bonjour, <strong>{user.prenom} {user.nom}</strong>
          </li>
          <li>
            <Link to="/" style={{ fontWeight: '600' }}>Tableau de bord</Link>
          </li>
          <li>
            <button 
              onClick={logout} 
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
            >
              Déconnexion
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Authenticated Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateContract />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractDetails />
                </ProtectedRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/signer" element={<SignContract />} />

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
