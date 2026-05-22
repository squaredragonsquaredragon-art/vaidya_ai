import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mic, ArrowRight, Stethoscope, AlertCircle, Lightbulb, ShieldCheck, Loader } from 'lucide-react';
import { chatAPI } from '../utils/api';

const SEVERITY_COLOR = {
  mild: '#10b981',
  moderate: '#f59e0b',
  serious: '#ef4444',
};
const SymptomAnalysis = () => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chatAPI.analyzeSymptoms(text);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event) => {
      setText(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const severityColor = result ? (SEVERITY_COLOR[result.severity] || '#818cf8') : '#818cf8';

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stethoscope size={28} color="#818cf8" /> {t('symptom.title')}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{t('symptom.subtitle')}</p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <textarea
          placeholder={t('symptom.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAnalyze()}
        />
        <div className="btn-group" style={{ flexDirection: 'row', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleVoice} style={{ flex: 1, opacity: isListening ? 0.7 : 1 }} disabled={isLoading}>
            <Mic size={16} /> {isListening ? t('symptom.btnListening') : t('symptom.btnListen')}
          </button>
          <button className="btn btn-primary" onClick={handleAnalyze} style={{ flex: 1 }} disabled={isLoading || !text.trim()}>
            {isLoading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('symptom.analyzing')}</>
              : <>{t('symptom.btnAnalyze')} <ArrowRight size={16} /></>
            }
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
          {t('symptom.tip')}
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderTop: '3px solid #ef4444', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} color="#ef4444" />
          {error}
        </div>
      )}

      {result && (
        <div className="card animate-slide-up" style={{ borderTop: `3px solid ${severityColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>🩺 {result.condition}</h2>
            {result.severity && (
              <span className={`tag tag-${result.severity === 'mild' ? 'green' : result.severity === 'moderate' ? 'yellow' : 'red'}`}>
                {result.severity === 'mild' ? t('cures.mild') : result.severity === 'moderate' ? t('cures.moderate') : t('cures.serious')}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('symptom.cause')}</h4><p>{result.cause}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Lightbulb size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('symptom.remedy')}</h4><p>{result.remedy}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('symptom.warning')}</h4><p>{result.warning}</p></div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1rem', lineHeight: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.75rem' }}>
            {t('symptom.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SymptomAnalysis;
