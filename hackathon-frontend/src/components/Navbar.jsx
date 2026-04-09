import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  // Get user data saved during the Google success flow
  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
    window.location.reload()
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🔍</span>
        Campus<span>Find</span>
      </Link>

      <div className="navbar-center">
        <Link to="/" className={path === '/' ? 'active' : ''}>Home</Link>
        <Link to="/lost" className={path === '/lost' ? 'active' : ''}>Lost Items</Link>
        <Link to="/found" className={path === '/found' ? 'active' : ''}>Found Items</Link>
        <Link to="/report-lost" className={path === '/report-lost' ? 'active' : ''}>Report</Link>
        <Link to="/about" className={path === '/about' ? 'active' : ''}>About</Link>
      </div>

      <div className="navbar-right">
        <button className="theme-btn">☀️</button>
        {user ? (
          <div className="user-nav-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#fff', fontSize: '0.9rem' }}>Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-login" onClick={handleLogout}>Log Out</button>
          </div>
        ) : (
          <>
            <button className="btn-login" onClick={() => navigate('/auth')}>Log In</button>
            <button className="btn-signup" onClick={() => navigate('/auth')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  )
}