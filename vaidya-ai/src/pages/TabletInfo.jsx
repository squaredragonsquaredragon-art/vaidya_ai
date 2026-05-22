import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Pill, Search, Info, Clock, AlertTriangle, CheckCircle, Loader, AlertCircle, Mic, UploadCloud, Camera } from 'lucide-react';
import { chatAPI } from '../utils/api';

const SEVERITY_MAP = {
  green: { label: 'OTC · Safe', color: '#10b981' },
  yellow: { label: 'Use With Care', color: '#f59e0b' },
  red: { label: 'Prescription Only', color: '#ef4444' },
};

const TabletInfo = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'scan'
  
  // Search state
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Scan state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // General state
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchTerm = query) => {
    const term = searchTerm.trim();
    if (!term) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chatAPI.analyzeMedicine(term);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get medicine info. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(t('medicine.micNotSupported') || 'Voice recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-US';
    recognition.interimResults = false;
    setIsListening(true);
    setError('');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      handleSearch(transcript);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setError(t('medicine.audioError') || 'Speech recognition failed. Try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chatAPI.analyzeTabletImage(selectedFile);
      setResult(response.data.data);
    } catch (err) {
      if (err.response?.status === 415) {
        setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      } else if (err.response?.status === 413) {
        setError('Image too large. Please use an image smaller than 10MB.');
      } else {
        setError(err.response?.data?.detail || 'Failed to analyze tablet image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const severityInfo = result ? (SEVERITY_MAP[result.severity] || SEVERITY_MAP.yellow) : null;

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pill size={28} color="#10b981" /> {t('medicine.title')}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          {t('medicine.subtitle')}
        </p>
      </header>

      {/* Modern glassmorphic tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '0.35rem',
        gap: '0.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={() => { setActiveTab('search'); setResult(null); setError(''); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'search' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'search' ? '#10b981' : '#94a3b8',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Search size={16} />
          {t('medicine.searchTab')}
        </button>
        <button
          onClick={() => { setActiveTab('scan'); setResult(null); setError(''); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'scan' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'scan' ? '#10b981' : '#94a3b8',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Camera size={16} />
          {t('medicine.scanTab')}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'search' ? (
        <div className="card animate-slide-up" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flex: 1, position: 'relative', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={isListening ? t('medicine.listening') : t('medicine.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  paddingRight: '3rem',
                  border: isListening ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.15)',
                  boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleVoice}
                disabled={isLoading}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                title={t('symptom.btnListen')}
              >
                {isListening ? (
                  <span className="listening-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                ) : (
                  <Mic size={16} />
                )}
              </button>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', minWidth: '120px' }} onClick={() => handleSearch()} disabled={isLoading || !query.trim()}>
              {isLoading
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('medicine.searching')}</>
                : <><Search size={16} /> {t('medicine.btnSearch')}</>
              }
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {t('medicine.tip')}
          </p>
        </div>
      ) : (
        <div className="card animate-slide-up" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label htmlFor="tablet-upload" className="upload-area" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                border: '2px dashed rgba(148, 163, 184, 0.25)',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.3s ease',
                marginBottom: '1.5rem'
              }}>
                <UploadCloud size={40} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
                <span className="upload-text" style={{ fontWeight: '500', color: '#cbd5e1' }}>{t('medicine.uploadText')}</span>
                <span className="upload-hint" style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>{t('medicine.uploadHint')}</span>
                <input
                  id="tablet-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={handleScan}
                disabled={!selectedFile || isLoading}
                style={{ width: '100%', opacity: selectedFile && !isLoading ? 1 : 0.5 }}
              >
                {isLoading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('medicine.scanning')}</>
                  : <><Camera size={16} /> {t('medicine.btnScan')}</>
                }
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: '200px', alignItems: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.02)' }}>
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Tablet Cover Preview"
                  style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.15)', objectFit: 'cover' }}
                />
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>{t('medicine.empty')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderTop: '3px solid #ef4444', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} color="#ef4444" />
          {error}
        </div>
      )}

      {result && (
        <div className="card animate-slide-up" style={{ borderTop: `3px solid ${severityInfo?.color || '#f59e0b'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem' }}>{result.name || query}</h2>
            {severityInfo && (
              <span className={`tag tag-${result.severity}`}>
                {result.severity === 'green' ? t('medicine.safe') : result.severity === 'yellow' ? t('medicine.care') : t('medicine.prescription')}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Info size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('medicine.whyUsed')}</h4><p>{result.use}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Clock size={20} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('medicine.dosage')}</h4><p>{result.dosage}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('medicine.sideEffects')}</h4><p>{result.side_effects}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('medicine.avoidIf')}</h4><p>{result.avoid}</p></div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1rem', lineHeight: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.75rem' }}>
            {t('medicine.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TabletInfo;
