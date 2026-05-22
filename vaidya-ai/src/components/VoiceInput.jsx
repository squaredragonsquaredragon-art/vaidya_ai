import React, { useState } from 'react';
import { Mic, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VoiceInput = () => {
  const [text, setText] = useState('');
  const { t } = useLanguage();

  const handleSynthesize = () => {
    if (!text.trim()) return;
    alert(`Analyzing symptoms: ${text}`);
  };

  return (
    <>
      <h2>{t('symptom.title')}</h2>
      <p className="subtitle">{t('symptom.subtitle')}</p>
      
      <div className="form-group">
        <label>{t('symptom.typeLabel')}</label>
        <textarea 
          placeholder={t('symptom.placeholder')} 
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary">
          <Mic size={18} /> {t('symptom.btnListen')}
        </button>
        <button className="btn btn-secondary" onClick={handleSynthesize}>
          {t('symptom.btnAnalyze')} <ArrowRight size={18} />
        </button>
      </div>
    </>
  );
};

export default VoiceInput;
