import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../api';
import './Form.css';

export default function Auth() {
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const data = await googleLogin(credentialResponse.credential);
      
      // Save data to storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Force refresh to home to update all global states
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <div className="form-header-icon">🎓</div>
        <div>
          <h2>Campus Access</h2>
          <p>Sign in with your university Google account to report and track items.</p>
        </div>
      </div>

      {error && <div className="alert error">❌ {error}</div>}

      <div className="form" style={{ alignItems: 'center', padding: '48px 24px' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google login widget failed to load.')}
          theme="filled_black"
          shape="pill"
          size="large"
        />
      </div>
    </div>
  );
}