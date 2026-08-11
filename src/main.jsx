import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './router/AppRouter';
import { ToastProvider } from './context/ToastContext';
import './i18n';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </React.StrictMode>
);

