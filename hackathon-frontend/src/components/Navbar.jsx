import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🔍 Campus<span>Find</span></Link>

      <div className="navbar-center">
        <Link to="/" className={path === '/' ? 'active' : ''}>Home</Link>
        <Link to="/lost" className={path === '/lost' ? 'active' : ''}>Lost Items</Link>
        <Link to="/found" className={path === '/found' ? 'active' : ''}>Found Items</Link>
        <Link to="/about" className={path === '/about' ? 'active' : ''}>About</Link>

        {user && user.role === 'admin' && (
          <Link to="/admin" className={path === '/admin' ? 'active' : ''} style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            🛡️ Admin Dashboard
          </Link>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <div className="user-info">
            <span>Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-login" onClick={handleLogout}>Log Out</button>
          </div>
        ) : (
          <button className="btn-login" onClick={() => navigate('/auth')}>Log In</button>
        )}
      </div>
    </nav>
  );
}