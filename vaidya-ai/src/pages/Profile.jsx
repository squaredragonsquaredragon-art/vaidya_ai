import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../utils/api';
import {
  Activity, Heart, Shield, Bell, Settings, LogOut, ChevronRight, User,
  Plus, X, Check, Loader, ClipboardList, Thermometer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const calculateHealthScore = (profile) => {
  if (!profile) return 98;
  let score = 100;

  // 1. Blood Pressure Systolic (110 - 130 is normal)
  const sys = profile.systolic;
  if (sys > 130) score -= Math.min(20, (sys - 130) * 0.5);
  else if (sys < 110) score -= Math.min(20, (110 - sys) * 0.5);

  // 2. Blood Pressure Diastolic (70 - 85 is normal)
  const dia = profile.diastolic;
  if (dia > 85) score -= Math.min(20, (dia - 85) * 0.6);
  else if (dia < 70) score -= Math.min(20, (70 - dia) * 0.6);

  // 3. Blood Sugar (70 - 120 is normal)
  const sugar = profile.sugar;
  if (sugar > 120) score -= Math.min(25, (sugar - 120) * 0.3);
  else if (sugar < 70) score -= Math.min(25, (70 - sugar) * 0.5);

  // 4. Heart Rate (60 - 90 is normal)
  const hr = profile.heart_rate;
  if (hr > 90) score -= Math.min(15, (hr - 90) * 0.4);
  else if (hr < 60) score -= Math.min(15, (60 - hr) * 0.4);

  // 5. BMI (Weight in kg / Height in m^2). Normal: 18.5 - 24.9
  const hMeters = profile.height / 100;
  if (hMeters > 0) {
    const bmi = profile.weight / (hMeters * hMeters);
    if (bmi > 25) score -= Math.min(20, (bmi - 25) * 2);
    else if (bmi < 18.5) score -= Math.min(20, (18.5 - bmi) * 2);
  }

  return Math.max(50, Math.min(100, Math.round(score)));
};

const getBPStatus = (sys, dia, isKn) => {
  if (sys < 120 && dia < 80) return { label: isKn ? 'ಸಾಮಾನ್ಯ' : 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
  if (sys < 130 && dia < 80) return { label: isKn ? 'ಹೆಚ್ಚಿದ' : 'Elevated', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return { label: isKn ? 'ಅಧಿಕ ಒತ್ತಡ' : 'Hypertension', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
};

const getSugarStatus = (sugar, isKn) => {
  if (sugar < 100) return { label: isKn ? 'ಸಾಮಾನ್ಯ' : 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
  if (sugar < 126) return { label: isKn ? 'ಪೂರ್ವ ಮಧುಮೇಹ' : 'Prediabetes', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return { label: isKn ? 'ಮಧುಮೇಹ' : 'Diabetes', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
};

const getHeartStatus = (hr, isKn) => {
  if (hr >= 60 && hr <= 100) return { label: isKn ? 'ಸಾಮಾನ್ಯ' : 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
  if (hr < 60) return { label: isKn ? 'ನಿಧಾನ ಬಡಿತ' : 'Bradycardia', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return { label: isKn ? 'ವೇಗ ಬಡಿತ' : 'Tachycardia', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
};

const Profile = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // Profile and interactive states
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Vitals inputs
  const [vitalsForm, setVitalsForm] = useState({
    systolic: 120,
    diastolic: 80,
    sugar: 95,
    heart_rate: 72,
    height: 170.0,
    weight: 70.0,
    activity_level: 'moderate'
  });

  // Meds inputs
  const [medForm, setMedForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    timeOfDay: 'Morning'
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await profileAPI.get();
      const data = response.data;
      setProfile(data);
      setVitalsForm({
        systolic: data.systolic,
        diastolic: data.diastolic,
        sugar: data.sugar,
        heart_rate: data.heart_rate,
        height: data.height,
        weight: data.weight,
        activity_level: data.activity_level
      });
    } catch (err) {
      setError('Failed to fetch profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      // Log vital update activity
      const updatedActivityList = profile ? JSON.parse(profile.recent_activity || '[]') : [];
      updatedActivityList.unshift({
        title: t('profile.activityVitals'),
        timestamp: new Date().toLocaleDateString(isKn ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      if (updatedActivityList.length > 5) updatedActivityList.pop();

      const response = await profileAPI.update({
        ...vitalsForm,
        recent_activity: JSON.stringify(updatedActivityList)
      });
      setProfile(response.data);
      setIsVitalsModalOpen(false);
    } catch (err) {
      setError('Failed to update medical vitals.');
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return;

    try {
      const medsList = profile ? JSON.parse(profile.medications || '[]') : [];
      const newMed = {
        id: Date.now().toString(),
        name: medForm.name,
        dosage: medForm.dosage,
        frequency: medForm.frequency,
        timeOfDay: medForm.timeOfDay,
        taken: false
      };
      medsList.push(newMed);

      const updatedActivityList = profile ? JSON.parse(profile.recent_activity || '[]') : [];
      updatedActivityList.unshift({
        title: `${t('profile.activityAddMed')}${medForm.name}`,
        timestamp: new Date().toLocaleDateString(isKn ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      if (updatedActivityList.length > 5) updatedActivityList.pop();

      const response = await profileAPI.update({
        medications: JSON.stringify(medsList),
        recent_activity: JSON.stringify(updatedActivityList)
      });

      setProfile(response.data);
      setMedForm({ name: '', dosage: '', frequency: 'Once daily', timeOfDay: 'Morning' });
      setIsMedModalOpen(false);
    } catch (err) {
      setError('Failed to add medication.');
    }
  };

  const handleToggleMedTaken = async (medId) => {
    if (!profile) return;
    try {
      const medsList = JSON.parse(profile.medications || '[]');
      const updatedMeds = medsList.map((m) => {
        if (m.id === medId) {
          return { ...m, taken: !m.taken };
        }
        return m;
      });

      const response = await profileAPI.update({
        medications: JSON.stringify(updatedMeds)
      });
      setProfile(response.data);
    } catch (err) {
      setError('Failed to update medication status.');
    }
  };

  const handleDeleteMed = async (medId) => {
    if (!profile) return;
    if (!window.confirm(isKn ? 'ಈ ಔಷಧಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?' : 'Are you sure you want to delete this medication?')) return;
    try {
      const medsList = JSON.parse(profile.medications || '[]');
      const updatedMeds = medsList.filter((m) => m.id !== medId);

      const response = await profileAPI.update({
        medications: JSON.stringify(updatedMeds)
      });
      setProfile(response.data);
    } catch (err) {
      setError('Failed to delete medication.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="animate-slide-up" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <User size={64} color="#64748b" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>{isKn ? 'ಲಾಗ್ ಇನ್ ಆಗಿಲ್ಲ' : 'Not Logged In'}</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{isKn ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್ ಪ್ರವೇಶಿಸಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.' : 'Please sign in to access your health profile.'}</p>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/auth')}>
          {t('auth.loginBtn')}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        <p style={{ color: '#94a3b8' }}>{isKn ? 'ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading Health Profile...'}</p>
      </div>
    );
  }

  // Derived dashboard metrics
  const medicationsList = profile ? JSON.parse(profile.medications || '[]') : [];
  const activityLogs = profile ? JSON.parse(profile.recent_activity || '[]') : [];
  const healthScore = calculateHealthScore(profile);
  const bpStatus = getBPStatus(profile?.systolic || 120, profile?.diastolic || 80, isKn);
  const sugarStatus = getSugarStatus(profile?.sugar || 95, isKn);
  const heartStatus = getHeartStatus(profile?.heart_rate || 72, isKn);

  const medsTakenCount = medicationsList.filter((m) => m.taken).length;
  const medsTotalCount = medicationsList.length;
  const intakeProgressPercent = medsTotalCount > 0 ? Math.round((medsTakenCount / medsTotalCount) * 100) : 0;

  // Set health score color code
  const scoreColor = healthScore >= 90 ? '#10b981' : healthScore >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="animate-slide-up" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>{t('profile.title')}</h1>
        <button className="btn btn-secondary" onClick={() => setIsVitalsModalOpen(true)} style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
          <Activity size={16} /> {t('profile.updateProfile')}
        </button>
      </header>

      {/* Banner Card */}
      <div className="card" style={{
        position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', padding: '2rem',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none',
        boxShadow: '0 10px 30px rgba(99,102,241,0.3)'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(255,255,255,0.4)', fontSize: '2.5rem', fontWeight: 'bold', color: 'white'
          }}>
            {(user?.name?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '700', color: 'white' }}>{user?.name || 'User'}</h2>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.3rem', color: 'white' }}>{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderTop: `3px solid ${scoreColor}` }}>
          <Heart size={28} color={scoreColor} style={{ marginBottom: '0.75rem' }} />
          <h3>{healthScore}%</h3>
          <span className="stat-label">{t('profile.healthScore')}</span>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <ClipboardList size={28} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
          <h3>{medsTotalCount}</h3>
          <span className="stat-label">{t('profile.upcomingMeds')}</span>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #06b6d4' }}>
          <Shield size={28} color="#06b6d4" style={{ marginBottom: '0.75rem' }} />
          <h3>{profile?.report_count || 0}</h3>
          <span className="stat-label">{t('profile.reports')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="profile-grid">
        {/* Left Column - Vitals Dashboard and Medication Intake checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Medical Vitals dashboard */}
          <div className="card">
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={20} color="#6366f1" /> {t('profile.vitalsTitle')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>BP (Systolic / Diastolic)</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f1f5f9' }}>{profile?.systolic || 120} / {profile?.diastolic || 80} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>mmHg</span></span>
                <span className="tag" style={{ color: bpStatus.color, background: bpStatus.bg, width: 'fit-content', marginTop: '4px' }}>{bpStatus.label}</span>
              </div>
              <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('profile.sugar')}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f1f5f9' }}>{profile?.sugar || 95} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span></span>
                <span className="tag" style={{ color: sugarStatus.color, background: sugarStatus.bg, width: 'fit-content', marginTop: '4px' }}>{sugarStatus.label}</span>
              </div>
              <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('profile.heart')}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f1f5f9' }}>{profile?.heart_rate || 72} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>bpm</span></span>
                <span className="tag" style={{ color: heartStatus.color, background: heartStatus.bg, width: 'fit-content', marginTop: '4px' }}>{heartStatus.label}</span>
              </div>
              <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('profile.height')} &amp; {t('profile.weight')}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f1f5f9' }}>{profile?.height || 170} cm / {profile?.weight || 70} kg</span>
                <span className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', width: 'fit-content', marginTop: '4px' }}>
                  BMI: {profile?.height > 0 ? (profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Medication Tracker Checklist */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} color="#f59e0b" /> {t('profile.medsTitle')}
              </h2>
              <button className="btn btn-secondary" onClick={() => setIsMedModalOpen(true)} style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}>
                <Plus size={14} /> {t('profile.addMed')}
              </button>
            </div>

            {/* Daily Intake progress bar */}
            {medsTotalCount > 0 && (
              <div style={{ marginBottom: '1.25rem', background: 'rgba(148,163,184,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>{t('profile.intakeProgress')}</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{medsTakenCount} / {medsTotalCount} ({intakeProgressPercent}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(148,163,184,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${intakeProgressPercent}%`, background: 'linear-gradient(90deg, #f59e0b, #e0a96d)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {medicationsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                {t('profile.noMeds')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {medicationsList.map((med) => (
                  <div key={med.id} className="info-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: med.taken ? 0.75 : 1, borderLeft: med.taken ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleMedTaken(med.id)}
                        style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: med.taken ? 'none' : '2px solid rgba(148,163,184,0.3)',
                          background: med.taken ? '#10b981' : 'transparent',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {med.taken && <Check size={14} />}
                      </button>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', textDecoration: med.taken ? 'line-through' : 'none', color: med.taken ? '#64748b' : '#f1f5f9' }}>{med.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {med.dosage} &bull; {med.frequency} &bull; {med.timeOfDay}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMed(med.id)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent activity logs and Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recent activities */}
          <div className="card">
            <h2>{t('profile.recentActivity')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {activityLogs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                  {isKn ? 'ಇತ್ತೀಚಿನ ಯಾವುದೇ ಚಟುವಟಿಕೆ ಲಾಗ್‌ಗಳಿಲ್ಲ.' : 'No recent activity logs available.'}
                </p>
              ) : (
                activityLogs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i !== activityLogs.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', color: '#818cf8' }}>
                        <Activity size={16} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#f1f5f9', fontWeight: '500' }}>{log.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{log.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Settings panel */}
          <div className="card">
            <h2>{t('profile.settings')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', width: '100%' }}>
                <Bell size={16} /> {isKn ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', width: '100%' }}>
                <Settings size={16} /> {isKn ? 'ಆದ್ಯತೆಗಳು' : 'Preferences'}
              </button>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', width: '100%', marginTop: '0.5rem' }}>
                <LogOut size={16} /> {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Editor Modal overlay */}
      {isVitalsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '16px', width: '90%', maxWidth: '500px', padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#f1f5f9' }}>{t('profile.updateProfile')}</h2>
              <button onClick={() => setIsVitalsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.systolic')}</label>
                  <input
                    type="number"
                    value={vitalsForm.systolic}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, systolic: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.diastolic')}</label>
                  <input
                    type="number"
                    value={vitalsForm.diastolic}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.sugar')}</label>
                  <input
                    type="number"
                    value={vitalsForm.sugar}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, sugar: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.heart')}</label>
                  <input
                    type="number"
                    value={vitalsForm.heart_rate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.height')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.height}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, height: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.weight')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.activity')}</label>
                <select
                  value={vitalsForm.activity_level}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, activity_level: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: 'white' }}
                >
                  <option value="sedentary">{t('profile.sedentary')}</option>
                  <option value="moderate">{t('profile.moderateAct')}</option>
                  <option value="active">{t('profile.activeAct')}</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                {t('profile.saveBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Medication Add Modal overlay */}
      {isMedModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '16px', width: '90%', maxWidth: '450px', padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#f1f5f9' }}>{t('profile.addMed')}</h2>
              <button onClick={() => setIsMedModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMedication} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.medName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.dosage')}</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={medForm.dosage}
                  onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.frequency')}</label>
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="Once daily">{t('profile.onceDaily')}</option>
                    <option value="Twice daily">{t('profile.twiceDaily')}</option>
                    <option value="Thrice daily">{t('profile.thriceDaily')}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{t('profile.timeOfDay')}</label>
                  <select
                    value={medForm.timeOfDay}
                    onChange={(e) => setMedForm({ ...medForm, timeOfDay: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="Morning">{t('profile.morning')}</option>
                    <option value="Noon">{t('profile.noon')}</option>
                    <option value="Evening">{t('profile.evening')}</option>
                    <option value="Night">{t('profile.night')}</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                {t('profile.addBtn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
