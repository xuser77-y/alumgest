import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle } from 'lucide-react';
import './Login.css'; // Importing the separated CSS

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(username, password);
      
      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/my-stats');
      }
    } catch (err) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <div className={`login-split-container ${isRTL ? 'rtl' : ''}`}>
      
      {/* ── BRAND SIDE (Gil Jakan Logo & Vibe) ── */}
      <div className="login-brand-side">
        <div className="brand-grid" />
        <div className="brand-content">
          <img src="/logo.jpg" alt="Gil Jakan Logo" className="logo-img" />
          <h1 className="brand-title">GIL JAKAN</h1>
          <p className="brand-subtitle">Precision Aluminium Management</p>
          <div className="industrial-line" />
        </div>
      </div>

      {/* ── FORM SIDE ── */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <h2 className="form-title text-dark">Connexion</h2>
          <p className="form-subtitle">Gérez votre production et vos finances.</p>

          {error && (
            <div className="form-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="jakan-input-group">
              <label className="jakan-label">Nom d'utilisateur</label>
              <div className="jakan-input-wrap">
                <span className="jakan-icon"><User size={20} /></span>
                <input
                  type="text"
                  className="jakan-field"
                  placeholder="Ex: admin"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="jakan-input-group">
              <label className="jakan-label">Mot de passe</label>
              <div className="jakan-input-wrap">
                <span className="jakan-icon"><Lock size={20} /></span>
                <input
                  type="password"
                  className="jakan-field"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-jakan">
              SE CONNECTER
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            GIL JAKAN ALUMINIUM © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;