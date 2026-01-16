
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const loadingScreen = document.getElementById('loading-screen');

const removeLoader = () => {
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.remove(), 500);
  }
};

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Rimuovi dopo il rendering con un piccolo buffer per fluidità
    setTimeout(removeLoader, 500);
  } catch (error) {
    console.error("Rendering Error:", error);
    removeLoader();
  }
} else {
  console.error("Errore fatale: Elemento #root non trovato nel DOM.");
  removeLoader();
}
