import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const path = location.pathname

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
        <button className="btn-login">Log In</button>
        <button className="btn-signup">Sign Up</button>
      </div>
    </nav>
  )
}