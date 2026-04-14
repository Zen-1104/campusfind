import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { loginGoogle } from '../api';
import './Auth.css';

export default function Auth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setLoading(true);

      if (!credentialResponse?.credential) {
        setError('No credential received from Google. Please try again.');
        return;
      }

      const data = await loginGoogle(credentialResponse.credential);

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
        window.location.reload();
      } else {
        setError(data.error || 'Google login failed. No token received.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glass-card">
        <div className="auth-section">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>

          <h2>Admin Portal</h2>
          <p>Access the CampusFind admin dashboard to manage lost &amp; found items.</p>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="google-btn-container" style={{ display: 'flex', justifyContent: 'center', margin: '30px 0', minHeight: '44px', width: '100%' }}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed. Please check if your popup is blocked or try again.')}
                theme="outline"
                shape="pill"
                size="large"
                ux_mode="popup"
              />
            )}
          </div>

          <div className="auth-footer-text">
            🔒 Restricted to authorized CampusFind administrators only. If an "Access Blocked" error occurs with Google, verify origins in the Google Cloud Console.
          </div>
        </div>
      </div>
    </div>
  );
}