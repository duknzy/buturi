import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign ResizeObserver notification warnings that can bubble up in some browsers/iframes
window.addEventListener('error', (event) => {
  if (
    event.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    event.message === 'ResizeObserver loop limit exceeded'
  ) {
    event.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
