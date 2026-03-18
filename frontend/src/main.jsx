import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'

// BOOTSTRAP & CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './i18n'; 
// TRANSLATION ENGINE (CRITICAL!)


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UIProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UIProvider>
  </React.StrictMode>,
)