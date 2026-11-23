import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemeToDom, useThemeStore } from './store';
import './index.css';
import App from './App.tsx';

// Aplica inmediatamente el tema persistido en Zustand antes del primer render
applyThemeToDom(useThemeStore.getState().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
