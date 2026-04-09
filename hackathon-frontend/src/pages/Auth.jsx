import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../api';
import './Form.css';

export default function Auth() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const data = await googleLogin(credentialResponse.credential);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="form-page">
      <div className="form-header" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="form-header-icon">🎓</div>
        <div>
          <h2>Campus Access</h2>
          <p>Sign in with your university Google account to report and track items.</p>
        </div>
      </div>

      {error && <div className="alert error">❌ {error}</div>}

      <div className="form" style={{ alignItems: 'center', padding: '48px 24px' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
          Secure, 1-click verification. No new passwords to remember.
        </div>
        
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google login widget failed to load.')}
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
        />
        
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
          By continuing, you agree to CampusFind's verification policy.<br/>
          Only authorized university domains are permitted.
        </div>
      </div>
    </div>
  );
}