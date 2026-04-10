import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { loginGoogle } from '../api';
import './Auth.css';

export default function Auth() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await loginGoogle(credentialResponse.credential);

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glass-card">
        <div className="auth-logo-icon" style={{ color: '#fff' }}>
          <svg 
            viewBox="0 0 24 24" 
            width="1em" 
            height="1em" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
          </svg>
        </div>
        <h2>Student Verification</h2>
        <p>To safely report or collect an item, please verify your campus identity.</p>

        <div className="google-btn-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Login Failed')}
            useOneTap
            theme="outline"
            shape="pill"
            size="large"
          />
        </div>

        <div className="auth-footer-text">
          CampusFind restricts this feature to verified campus accounts to maintain a safe, trusted, and accountable community platform.
        </div>
      </div>
    </div>
  );
}