import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/found?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home-page">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">💚 YOUR CAMPUS. YOUR COMMUNITY.</div>
          <h1>
            Lost something<br />on <span className="highlight">campus?</span>
          </h1>
          <p className="hero-desc">
            We help you find it faster. Report lost items or<br />
            help others by listing what you've found.
          </p>

          {/* Search Bar */}
          <form className="search-bar" onSubmit={handleSearch}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{marginLeft: '15px'}}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search found items (e.g., laptop, wallet, keys...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="filter-icon" style={{border: 'none', background: 'transparent', cursor: 'pointer', paddingRight: '15px'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Action Cards */}
          <div className="hero-actions">
            <button className="action-card lost-action" onClick={() => navigate('/report-lost')}>
              <div className="action-icon">📝</div>
              <div>
                <strong>Report Lost Item</strong>
                <span>Let us help you find it</span>
              </div>
            </button>
            <button className="action-card found-action" onClick={() => navigate('/report-found')}>
              <div className="action-icon">📦</div>
              <div>
                <strong>Report Found Item</strong>
                <span>Help return it to its owner</span>
              </div>
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src="/images/hero-illustration.png" alt="Campus items illustration" />
          {/* Trust Badge */}
          <div className="trust-badge">
            <div className="trust-icon">🛡️</div>
            <div>
              <strong>Safe & Trusted</strong>
              <span>Verified reports, real people</span>
            </div>
          </div>
          {/* Student Count */}
          <div className="student-badge">
            <div className="avatar-group">
              <div className="avatar a1"></div>
              <div className="avatar a2"></div>
              <div className="avatar a3"></div>
            </div>
            <span>Join <strong>850+</strong><br />students</span>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="stats-section">
        <div className="stat-item">
          <div className="stat-icon green">📦</div>
          <div>
            <h3>120+</h3>
            <p>Items Recovered</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon blue">👥</div>
          <div>
            <h3>850+</h3>
            <p>Happy Students</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon teal">✅</div>
          <div>
            <h3>98%</h3>
            <p>Successful Returns</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon purple">⏱️</div>
          <div>
            <h3>2.5 Days</h3>
            <p>Avg. Return Time</p>
          </div>
        </div>
      </section>

      {/* ===== BROWSE SECTION ===== */}
      <section className="browse-section">
        <div className="browse-header">
          <div>
            <h2>Browse Items</h2>
            <p>See what others are looking for or what's been found.</p>
          </div>
          <button className="btn-view-all" onClick={() => navigate('/found')}>View All Items →</button>
        </div>

        <div className="browse-cards">
          <div className="browse-card" onClick={() => navigate('/lost')}>
            <div className="browse-card-content">
              <div className="browse-card-icon">🔍</div>
              <h3>Lost Items</h3>
              <p>Find items others have reported as lost on campus.</p>
              <button className="browse-card-btn">View Lost Items →</button>
            </div>
            <div className="browse-card-badge">56 New</div>
            <img src="/images/lost-items-card.png" alt="Lost items" className="browse-card-img" />
          </div>

          <div className="browse-card found" onClick={() => navigate('/found')}>
            <div className="browse-card-content">
              <div className="browse-card-icon">📦</div>
              <h3>Found Items</h3>
              <p>Browse items that have been found and turned in.</p>
              <button className="browse-card-btn">View Found Items →</button>
            </div>
            <div className="browse-card-badge found-badge">34 New</div>
            <img src="/images/found-items-card.png" alt="Found items" className="browse-card-img" />
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🔍 CampusFind</h3>
            <p>Bringing campus communities closer, one item at a time.</p>
            <div className="social-icons">
              <span>📷</span>
              <span>💬</span>
              <span>✉️</span>
              <span>🐦</span>
            </div>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/lost">Lost Items</a>
            <a href="/found">Found Items</a>
            <a href="/report-found">Report an Item</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Safety Tips</a>
            <a href="#">FAQ</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 CampusFind. All rights reserved.</span>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}