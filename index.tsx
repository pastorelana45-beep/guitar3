
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const loadingScreen = document.getElementById('loading-screen');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Rimuovi il caricamento dopo un breve delay per garantire che React abbia renderizzato
  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 500);
    }
  }, 300);
} else {
  console.error("Errore fatale: Elemento #root non trovato nel DOM.");
}
