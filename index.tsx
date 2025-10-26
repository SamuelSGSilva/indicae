import React from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/Index'; // Importe a página Index

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Index /> {/* Renderize a página Index */}
  </React.StrictMode>
);