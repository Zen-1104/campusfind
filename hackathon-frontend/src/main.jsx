import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css'; // Global styles

// The Google Client ID links your frontend to your Google Cloud Console project
const GOOGLE_CLIENT_ID = "264145714129-1l9ak5osn77po04ms73kqhi46sl5psi7.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the app with Google OAuth Provider to enable login anywhere in the app */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);