import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ensureAircraftsSeed } from './db'; // ← NUEVO

// ✨ NUEVO: Asegurar matrículas antes de renderizar
ensureAircraftsSeed().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});