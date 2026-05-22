import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Heart, Zap, Pill, ShieldCheck, Loader, AlertCircle } from 'lucide-react';
import { chatAPI } from '../utils/api';

const SEVERITY_MAP = {
  mild: { color: '#10b981', tagClass: 'green' },
  moderate: { color: '#f59e0b', tagClass: 'yellow' },
  serious: { color: '#ef4444', tagClass: 'red' },
};

const DiseaseCure = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chatAPI.analyzeDisease(query.trim());
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get disease information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const severityInfo = result ? (SEVERITY_MAP[result.severity] || SEVERITY_MAP.moderate) : null;
  const severityLabel = result?.severity
    ? (result.severity === 'mild' ? t('cures.mild') : result.severity === 'moderate' ? t('cures.moderate') : t('cures.serious'))
    : '';

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={28} color="#8b5cf6" /> {t('cures.title')}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          {t('cures.subtitle')}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder={t('cures.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" style={{ width: 'auto', minWidth: '120px' }} onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('cures.searching')}</>
              : <><Search size={16} /> {t('cures.btnSearch')}</>
            }
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
          {t('cures.tip')}
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderTop: '3px solid #ef4444', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} color="#ef4444" />
          {error}
        </div>
      )}

      {result && (
        <div className="card animate-slide-up" style={{ borderTop: `3px solid ${severityInfo?.color || '#f59e0b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>{result.name || query}</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.3rem' }}>{result.desc}</p>
            </div>
            {severityInfo && (
              <span className={`tag tag-${severityInfo.tagClass}`}>{severityLabel}</span>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Zap size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('cures.causes')}</h4><p>{result.causes}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Search size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('cures.symptoms')}</h4><p>{result.symptoms}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Pill size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('cures.treatment')}</h4><p>{result.cure}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('cures.prevention')}</h4><p>{result.prevention}</p></div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1rem', lineHeight: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.75rem' }}>
            {t('cures.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DiseaseCure;
