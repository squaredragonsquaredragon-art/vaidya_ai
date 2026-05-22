import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Pill, Camera, Search, FileText, Heart, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const Home = () => {
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const features = [
    { icon: <Stethoscope size={28} />, title: t('features.symptoms.title'), desc: t('features.symptoms.desc'), link: '/symptoms', color: 'rgba(99,102,241,0.15)', iconColor: '#818cf8' },
    { icon: <Pill size={28} />, title: t('features.medicine.title'), desc: t('features.medicine.desc'), link: '/medicine', color: 'rgba(16,185,129,0.15)', iconColor: '#10b981' },
    { icon: <Camera size={28} />, title: t('features.diagnosis.title'), desc: t('features.diagnosis.desc'), link: '/diagnosis', color: 'rgba(245,158,11,0.15)', iconColor: '#f59e0b' },
    { icon: <Search size={28} />, title: t('features.cures.title'), desc: t('features.cures.desc'), link: '/cures', color: 'rgba(139,92,246,0.15)', iconColor: '#8b5cf6' },
    { icon: <FileText size={28} />, title: t('features.records.title'), desc: t('features.records.desc'), link: '/records', color: 'rgba(6,182,212,0.15)', iconColor: '#06b6d4' },
    { icon: <Heart size={28} />, title: t('features.profile.title'), desc: t('features.profile.desc'), link: '/profile', color: 'rgba(239,68,68,0.15)', iconColor: '#ef4444' },
  ];

  const handleCardClick = (e, link) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/auth');
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' }}>
      
      {/* Hero Welcome Section */}
      {isLoggedIn ? (
        <section className="hero" style={{ textAlign: 'left', padding: '2.5rem 2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.8))', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
              {t('home.welcomeBack')}, {user?.full_name || user?.username || 'User'}! 🏥
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
              {t('home.welcomeSubtitle')}
            </p>
          </div>
          <Link to="/profile" className="btn btn-secondary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
            {t('navbar.profile')} <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <section className="hero" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ background: 'linear-gradient(135deg, #f1f5f9 20%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.8rem', fontWeight: '850', lineHeight: 1.25 }}>
            {t('home.heroTitle')}
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '700px', margin: '1rem auto 0', lineHeight: 1.6 }}>
            {t('home.heroDesc')}
          </p>
        </section>
      )}

      {/* Guest Lock Banner */}
      {!isLoggedIn && (
        <div className="card text-center animate-slide-up" style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.03))',
          border: '1px solid rgba(99, 102, 241, 0.2)', 
          padding: '2.5rem 1.5rem', 
          marginBottom: '2.5rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(8px)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#818cf8', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Lock size={20} /> {t('home.guestTitle')}
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '650px', margin: '0 auto 1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {t('home.guestDesc')}
          </p>
          <Link to="/auth" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '0.75rem 2.2rem', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            {t('home.ctaBtn')}
          </Link>
        </div>
      )}

      <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={20} color="#818cf8" /> {t('home.featuresTitle')}
      </h2>

      {/* Feature Cards Grid */}
      <div className="features-grid" style={{ pointerEvents: 'auto' }}>
        {features.map((f, i) => {
          const content = (
            <>
              <div className="icon-wrap" style={{ background: f.color, color: f.iconColor }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {f.title}
                {!isLoggedIn && <Lock size={12} color="#64748b" style={{ marginLeft: 'auto' }} />}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>{f.desc}</p>
              
              {!isLoggedIn && (
                <div style={{ 
                  marginTop: 'auto', 
                  fontSize: '0.75rem', 
                  color: '#64748b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontWeight: '500',
                  borderTop: '1px solid rgba(148, 163, 184, 0.05)',
                  paddingTop: '0.5rem'
                }}>
                  <Lock size={10} /> {t('home.lockedText')}
                </div>
              )}
            </>
          );

          if (isLoggedIn) {
            return (
              <Link 
                to={f.link} 
                key={i} 
                className="feature-card animate-slide-up" 
                style={{ animationDelay: `${i * 0.06}s`, display: 'flex', flexDirection: 'column' }}
              >
                {content}
              </Link>
            );
          } else {
            return (
              <div 
                key={i} 
                onClick={(e) => handleCardClick(e, f.link)}
                className="feature-card animate-slide-up" 
                style={{ 
                  animationDelay: `${i * 0.06}s`, 
                  opacity: 0.7, 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(148,163,184,0.05)',
                  background: 'rgba(30,41,59,0.3)',
                  display: 'flex', 
                  flexDirection: 'column'
                }}
              >
                {content}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default Home;
