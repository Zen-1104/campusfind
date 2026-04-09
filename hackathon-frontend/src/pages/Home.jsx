import { useNavigate, Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <section className="hero-section">
        <div className="hero-bg" />

        <div className="hero-content">
          <div className="hero-badge anim-fadeUp delay-1">💚 YOUR CAMPUS. YOUR COMMUNITY.</div>
          <h1 className="anim-fadeUp delay-2">Lost something<br />on <span>campus?</span></h1>
          <p className="anim-fadeUp delay-3">We help you find it faster. Report lost items or help others by listing what you've found.</p>

          <div className="hero-search anim-fadeUp delay-4">
            <span className="search-icon">🔍</span>
            <input placeholder="Search lost items (e.g., laptop, wallet, keys...)" />
            <span className="search-shortcut">⌘K</span>
          </div>

          <div className="hero-buttons anim-fadeUp delay-5">
            <button className="hero-btn hero-btn-lost" onClick={() => navigate('/report-lost')}>
              <div className="hero-btn-icon">📋</div>
              <div>
                <div className="hero-btn-label">Report Lost Item</div>
                <div className="hero-btn-sub">Let us help you find it</div>
              </div>
            </button>
            <button className="hero-btn hero-btn-found" onClick={() => navigate('/report-found')}>
              <div className="hero-btn-icon">📦</div>
              <div>
                <div className="hero-btn-label">Report Found Item</div>
                <div className="hero-btn-sub">Help return it to its owner</div>
              </div>
            </button>
          </div>
        </div>

        <div className="hero-float-trust anim-slideRight delay-3">
          <div className="trust-icon">🛡️</div>
          <div>
            <div className="trust-title">Safe & Trusted</div>
            <div className="trust-sub">Verified reports,<br />real people</div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item anim-fadeUp delay-1">
          <div className="stat-icon">📋</div>
          <div>
            <div className="stat-num">120+</div>
            <div className="stat-label">Items Recovered</div>
          </div>
        </div>
        <div className="stat-item anim-fadeUp delay-2">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-num">850+</div>
            <div className="stat-label">Happy Students</div>
          </div>
        </div>
        <div className="stat-item anim-fadeUp delay-3">
          <div className="stat-icon">🛡️</div>
          <div>
            <div className="stat-num">98%</div>
            <div className="stat-label">Successful Returns</div>
          </div>
        </div>
        <div className="stat-item anim-fadeUp delay-4">
          <div className="stat-icon">⏱️</div>
          <div>
            <div className="stat-num">2.5 Days</div>
            <div className="stat-label">Avg. Return Time</div>
          </div>
        </div>
      </section>

      <section className="browse-section">
        <div className="browse-header anim-fadeUp delay-1">
          <div>
            <h2>Browse Items</h2>
            <p>See what others are looking for or what's been found.</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate('/lost')}>View All Items →</button>
        </div>

        <div className="browse-cards">
          <div className="browse-card lost-card anim-slideLeft delay-2" onClick={() => navigate('/lost')}>
            <div>
              <div className="card-icon-box">🔍</div>
              <div className="browse-card-text">
                <h3>Lost Items</h3>
                <p>Find items others have reported as lost on campus.</p>
                <Link to="/lost" className="browse-card-link" onClick={e => e.stopPropagation()}>
                  View Lost Items →
                </Link>
              </div>
            </div>
            <div className="browse-card-badge">56 New</div>
            <div className="browse-card-img">🎒</div>
          </div>

          <div className="browse-card found-card anim-slideRight delay-3" onClick={() => navigate('/found')}>
            <div>
              <div className="card-icon-box">📦</div>
              <div className="browse-card-text">
                <h3>Found Items</h3>
                <p>Browse items that have been found and turned in.</p>
                <Link to="/found" className="browse-card-link" onClick={e => e.stopPropagation()}>
                  View Found Items →
                </Link>
              </div>
            </div>
            <div className="browse-card-badge">34 New</div>
            <div className="browse-card-img">📦</div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-grid anim-fadeUp delay-2">
          <div>
            <div className="footer-brand-name">🔍 Campus<span>Find</span></div>
            <p className="footer-desc">Bringing campus communities closer,<br />one item at a time.</p>
            <div className="footer-socials">
              <a className="social-btn" href="#">📸</a>
              <a className="social-btn" href="#">💬</a>
              <a className="social-btn" href="#">✉️</a>
              <a className="social-btn" href="#">🐦</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/lost">Lost Items</Link>
            <Link to="/found">Found Items</Link>
            <Link to="/report-lost">Report an Item</Link>
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
          <div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  )
}