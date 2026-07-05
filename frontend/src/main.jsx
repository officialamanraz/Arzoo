import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 👈 Yeh naya import hai
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter> {/* 👈 App ab Router ke andar safe hai */}
      <App />
    </BrowserRouter>
);