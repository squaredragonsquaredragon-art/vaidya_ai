import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        await register(email, password, name || undefined);
      }
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Invalid input. Please check your details.');
      } else {
        setError(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{
      display: 'flex', minHeight: '75vh', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '880px',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(148,163,184,0.1)',
      }}>
        {/* Left Branding */}
        <div style={{
          flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)',
          color: 'white', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '14px', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>V</div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.8rem' }}>{t('auth.brand')}</h2>
            <p style={{ opacity: 0.85, fontSize: '1rem', lineHeight: 1.7 }}>{t('auth.subtitle')}</p>
          </div>
        </div>

        {/* Right Form */}
        <div style={{ flex: 1, padding: '3rem', background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '2rem', color: '#f1f5f9' }}>
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.2rem',
              color: '#fca5a5', fontSize: '0.875rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.4rem' }}>{t('auth.name')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.4rem' }}>{t('auth.email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#94a3b8', marginBottom: '0.4rem' }}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', opacity: isLoading ? 0.75 : 1 }} disabled={isLoading}>
              {isLoading
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                : <>{isLogin ? t('auth.loginBtn') : t('auth.registerBtn')} <ArrowRight size={16} /></>
              }
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
