import React from 'react';
import { Link } from 'react-router-dom';
import { User, Globe, LogIn, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo-container">
        <div className="logo-icon">V</div>
        <div className="logo-text">
          <span className="logo-title">{t('navbar.title')}</span>
          <span className="logo-subtitle">{t('navbar.subtitle')}</span>
        </div>
      </Link>
      
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '20px', background: 'rgba(30,41,59,0.8)' }}>
          <Globe size={14} color="#64748b" />
          <select 
            className="lang-selector" 
            style={{ border: 'none', padding: 0, outline: 'none', fontSize: '0.8rem' }}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>

        {isLoggedIn ? (
          <>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#f1f5f9', fontWeight: '500', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.85rem' }}>
              <User size={16} color="#818cf8" />
              {user?.name || t('navbar.profile')}
            </Link>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
              <LogOut size={14} /> {t('profile.logout')}
            </button>
          </>
        ) : (
          <Link to="/auth" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#f1f5f9', fontWeight: '500', padding: '6px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: '0.85rem' }}>
            <LogIn size={14} /> {t('auth.loginBtn')}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
