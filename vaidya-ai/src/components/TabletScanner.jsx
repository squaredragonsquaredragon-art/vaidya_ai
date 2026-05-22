import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const TabletScanner = () => {
  const { t } = useLanguage();
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [medicines, setMedicines] = useState([]);

  const handleAddMedicine = () => {
    if (!medicineName.trim()) return;
    
    const newMed = {
      id: Date.now(),
      name: medicineName,
      dosage,
      schedule,
      // Mock AI info for "YEN TABLET YAKE USE MADBEKU" (Why to use this tablet)
      reason: 'AI Analysis: Primarily used to relieve mild to moderate pain and reduce fever.'
    };
    
    setMedicines([...medicines, newMed]);
    setMedicineName('');
    setDosage('');
    setSchedule('');
  };

  return (
    <>
      <h2>{t('medicine.title')}</h2>
      <p className="subtitle">{t('medicine.subtitle')}</p>
      
      <div className="form-group">
        <label>{t('medicine.add')}</label>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.8rem', textTransform: 'none' }}>{t('medicine.name')}</label>
          <input 
            type="text" 
            placeholder={t('medicine.namePlaceholder')} 
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.8rem', textTransform: 'none' }}>{t('medicine.dosage')}</label>
          <input 
            type="text" 
            placeholder={t('medicine.dosagePlaceholder')} 
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', textTransform: 'none' }}>{t('medicine.schedule')}</label>
          <input 
            type="text" 
            placeholder={t('medicine.schedulePlaceholder')} 
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleAddMedicine}>
          {t('medicine.btnAdd')}
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem', textTransform: 'uppercase' }}>
          {t('medicine.yourMeds')}
        </p>
        
        {medicines.length === 0 ? (
          <div className="empty-state">
            {t('medicine.empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {medicines.map(med => (
              <div key={med.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{med.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: '500' }}>{med.dosage} • {med.schedule}</span>
                </div>
                {/* AI info about the tablet based on user requirement */}
                <div style={{ fontSize: '0.85rem', color: '#4b5563', backgroundColor: '#eff6ff', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                  <strong>{t('medicine.usageInfo')}</strong> {med.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TabletScanner;
