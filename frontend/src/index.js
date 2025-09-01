import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// ===================================================================
// --- PASTE YOUR OAUTH 2.0 CLIENT ID FROM GOOGLE CLOUD HERE ---
// ===================================================================
const googleClientId = "1001147206231-afs8ordgj9i3b7n9a65ka5ncamapcnf3.apps.googleusercontent.com";
// ===================================================================

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
