import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UploadCloud, Camera, AlertCircle, Lightbulb, ShieldCheck, Loader } from 'lucide-react';
import { chatAPI } from '../utils/api';

const SEVERITY_COLOR = {
  mild: '#10b981',
  moderate: '#f59e0b',
  serious: '#ef4444',
};

const ImageDiagnosis = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chatAPI.analyzeImage(selectedFile);
      setResult(response.data.data);
    } catch (err) {
      if (err.response?.status === 415) {
        setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      } else if (err.response?.status === 413) {
        setError('Image too large. Please use an image smaller than 10MB.');
      } else {
        setError(err.response?.data?.detail || 'Failed to analyze image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const severityColor = result ? (SEVERITY_COLOR[result.severity] || '#f59e0b') : '#f59e0b';

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Camera size={28} color="#f59e0b" /> {t('image.title')}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          {t('image.subtitle')}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <label htmlFor="skin-upload" className="upload-area">
              <UploadCloud size={40} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
              <span className="upload-text">{t('image.uploadText')}</span>
              <span className="upload-hint">{t('image.uploadHint')}</span>
              <input
                id="skin-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </label>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!selectedFile || isLoading}
              style={{ opacity: selectedFile && !isLoading ? 1 : 0.5 }}
            >
              {isLoading
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('image.analyzing')}</>
                : <><Camera size={16} /> {t('image.btnAnalyze')}</>
              }
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '200px', alignItems: 'center' }}>
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.15)', objectFit: 'cover' }}
              />
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>{t('image.empty')}</p>
            )}
          </div>
        </div>
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
            <h2 style={{ fontSize: '1.2rem' }}>🔍 {result.condition}</h2>
            {result.severity && (
              <span className={`tag tag-${result.severity === 'mild' ? 'green' : result.severity === 'moderate' ? 'yellow' : 'red'}`}>
                {result.severity === 'mild' ? t('cures.mild') : result.severity === 'moderate' ? t('cures.moderate') : t('cures.serious')}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('image.whyHappened')}</h4><p>{result.cause}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Lightbulb size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('image.whatToDo')}</h4><p>{result.remedy}</p></div>
            </div>
            <div className="info-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div><h4>{t('image.warning')}</h4><p>{result.warning}</p></div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '1rem', lineHeight: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '0.75rem' }}>
            {t('image.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageDiagnosis;
