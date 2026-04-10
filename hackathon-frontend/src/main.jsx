import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css'; // Global styles

// The Google Client ID links your frontend to your Google Cloud Console project
const GOOGLE_CLIENT_ID = "84644656189-6q67uk9u76gu3qihn3mu2qhhviho89qd.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the app with Google OAuth Provider to enable login anywhere in the app */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);