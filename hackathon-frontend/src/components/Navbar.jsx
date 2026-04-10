import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Campus<span>Find</span>
      </Link>

      <div className="navbar-center">
        <div className="nav-pill">
          <Link to="/" className={path === '/' ? 'active' : ''}>Home</Link>
          <Link to="/lost" className={path === '/lost' ? 'active' : ''}>Lost Items</Link>
          <Link to="/found" className={path === '/found' ? 'active' : ''}>Found Items</Link>
          <Link to="/report-found" className={path.startsWith('/report') ? 'active' : ''}>Report</Link>
          <Link to="/about" className={path === '/about' ? 'active' : ''}>About</Link>
        </div>
      </div>

      <div className="navbar-right">
        {user && user.role === 'admin' && (
          <Link to="/admin" className="admin-badge">🛡️</Link>
        )}
        {user ? (
          <div className="user-profile">
            <span className="welcome-text">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-logout" onClick={handleLogout}>Log Out</button>
          </div>
        ) : (
          <>
            <button className="btn-login" onClick={() => navigate('/auth')}>Log In</button>
            <button className="btn-signup" onClick={() => navigate('/auth')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}