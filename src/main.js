import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import ErrorBoundary from './ErrorBoundary.js';

createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);
