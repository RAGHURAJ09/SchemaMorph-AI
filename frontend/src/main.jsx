import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2a',
            color: '#e0e7ff',
            border: '1px solid #2e2e42',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0f0f14' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0f0f14' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
