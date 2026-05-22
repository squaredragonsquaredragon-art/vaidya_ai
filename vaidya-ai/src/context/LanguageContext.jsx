import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('vaidya_lang') || 'en';
  });

  const setLanguage = (lang) => {
    localStorage.setItem('vaidya_lang', lang);
    setLanguageState(lang);
  };

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let current = translations[language] || translations['en'];
    
    for (const key of keys) {
      if (current === undefined || current[key] === undefined) {
        // Fallback to English if key doesn't exist in the current language
        const fallback = translations['en'];
        let fallbackCurrent = fallback;
        for (const fKey of keys) {
          if (fallbackCurrent === undefined || fallbackCurrent[fKey] === undefined) return keyPath;
          fallbackCurrent = fallbackCurrent[fKey];
        }
        return fallbackCurrent;
      }
      current = current[key];
    }
    
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
