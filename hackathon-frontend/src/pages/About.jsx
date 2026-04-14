import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="about-page">

      {/* ── Hero Section ── */}
      <section className="about-hero">
        <div className="about-hero-glow" />
        <span className="about-badge">🎓 BUILT FOR CAMPUS LIFE</span>
        <h1>
          Reuniting People with <br />
          <span className="gradient-text">What Matters Most</span>
        </h1>
        <p className="about-subtitle">
          CampusFind is a smart lost‑and‑found platform designed exclusively for
          university communities — making it effortless to report, track, and
          recover lost belongings.
        </p>
      </section>

      {/* ── Mission ── */}
      <section className="about-section">
        <div className="section-label">OUR MISSION</div>
        <h2>Why CampusFind Exists</h2>
        <p className="section-description">
          Every semester, thousands of items go missing on campus — from laptops
          and ID cards to wallets and water bottles. Most of these items are
          found by good Samaritans but never make it back to their owner because
          there is no simple, centralised way to connect the two.
        </p>
        <p className="section-description">
          <strong>CampusFind bridges that gap.</strong> We provide a single
          digital hub where anyone on campus can report items they've found,
          browse what's been lost, and let campus security manage the entire
          hand-off process — transparently and securely.
        </p>
      </section>

      {/* ── How It Works ── */}
      <section className="about-section">
        <div className="section-label">HOW IT WORKS</div>
        <h2>Simple. Fast. Secure.</h2>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">📢</div>
            <h3>Report</h3>
            <p>
              Found something? Snap a photo, fill a quick form, and submit.
              Lost something? List it so finders can match it.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🔍</div>
            <h3>Discover</h3>
            <p>
              Browse the Found Items gallery or search by keyword, category,
              or location to spot your belongings instantly.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">🛡️</div>
            <h3>Verify</h3>
            <p>
              Campus security reviews every report, verifies ownership, and
              tracks the item through a transparent status pipeline.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <div className="step-icon">🤝</div>
            <h3>Reunite</h3>
            <p>
              Once verified, the rightful owner collects their item from the
              security desk. Everyone wins.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="about-section">
        <div className="section-label">KEY FEATURES</div>
        <h2>What Makes Us Different</h2>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-emoji">📸</span>
            <h3>Photo Uploads</h3>
            <p>Attach high-quality images of found items so owners can identify their belongings at a glance.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🔒</span>
            <h3>Privacy First</h3>
            <p>Uploaded photos are only visible to verified administrators, protecting everyone's privacy.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">📊</span>
            <h3>Admin Dashboard</h3>
            <p>A powerful command center for campus security to manage, verify, and track every item in real time.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🔎</span>
            <h3>Smart Search</h3>
            <p>Instantly search across all listings by name, category, or location to find what you're looking for.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">📱</span>
            <h3>Mobile Friendly</h3>
            <p>Fully responsive design — report and browse items from your phone, tablet, or laptop.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">⚡</span>
            <h3>Real-Time Status</h3>
            <p>Track your item's journey: Submitted → Verified → At Security → Collected. Always in the loop.</p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="about-section">
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Free to Use</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Always Online</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">🔐</span>
            <span className="stat-label">Secure & Private</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">🎓</span>
            <span className="stat-label">Built for Students</span>
          </div>
        </div>
      </section>

      {/* ── Team / Credits ── */}
      <section className="about-section">
        <div className="section-label">THE TEAM</div>
        <h2>Built with ❤️ by Students</h2>
        <p className="section-description">
          CampusFind was created by a passionate team of student developers
          with one simple belief:
          <em> technology should solve real, everyday problems.</em> We combined
          modern web technologies with a user-first philosophy to create
          something that truly helps the campus community.
        </p>
        <div className="tech-pills">
          <span className="pill">React</span>
          <span className="pill">Flask</span>
          <span className="pill">SQLite</span>
          <span className="pill">JWT Auth</span>
          <span className="pill">REST API</span>
          <span className="pill">Google OAuth</span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <h2>Ready to help your campus?</h2>
        <p>Report a found item or search for your lost belongings — it only takes a minute.</p>
        <div className="cta-buttons">
          <Link to="/report-found" className="cta-btn primary">Report Found Item</Link>
          <Link to="/lost" className="cta-btn secondary">Browse Lost Items</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="about-footer">
        <p>© 2026 CampusFind · Made for the community, by the community.</p>
      </footer>
    </div>
  );
}
