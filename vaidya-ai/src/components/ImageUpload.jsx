import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const { t } = useLanguage();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;
    alert('Analyzing image using CNN classification...');
  };

  return (
    <>
      <h2>{t('image.title')}</h2>
      <p className="subtitle">{t('image.subtitle')}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', alignItems: 'center' }}>
        <div>
          <label htmlFor="file-upload" className="upload-area" style={{ marginBottom: '1rem' }}>
            <UploadCloud className="upload-icon" />
            <span className="upload-text">{t('image.uploadText')}</span>
            <span className="upload-hint">{t('image.uploadHint')}</span>
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
            />
          </label>
          <button 
            className="btn btn-secondary" 
            onClick={handleAnalyze}
            disabled={!selectedImage}
            style={{ opacity: selectedImage ? 1 : 0.6 }}
          >
            {t('image.btnAnalyze')}
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
          {selectedImage ? (
            <img 
              src={selectedImage} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #e5e7eb', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>
              {t('image.empty')}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageUpload;
