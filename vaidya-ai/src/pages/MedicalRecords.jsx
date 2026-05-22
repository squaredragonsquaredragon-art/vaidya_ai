import React, { useState, useEffect } from 'react';
import { FileText, UploadCloud, Trash2, Eye, Calendar, Loader, AlertCircle, Lock } from 'lucide-react';
import { recordsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MedicalRecords = () => {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  
  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch records on mount (if logged in)
  useEffect(() => {
    if (isLoggedIn) {
      fetchRecords();
    }
  }, [isLoggedIn]);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await recordsAPI.list();
      setRecords(response.data);
    } catch (err) {
      setError(t('records.loading') === 'Loading records...' ? 'Failed to load records. Please try again.' : 'ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    e.target.value = ''; // reset input

    setIsUploading(true);
    setError('');
    try {
      const response = await recordsAPI.upload(file);
      setRecords((prev) => [response.data, ...prev]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Upload failed. Please check file type and size.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('records.confirmDelete'))) return;
    setDeletingId(id);
    setError('');
    try {
      await recordsAPI.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError('Failed to delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id) => {
    const url = recordsAPI.getDownloadUrl(id);
    window.open(url, '_blank');
  };

  // Filter records dynamically based on category and search query
  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory === 'Prescriptions') {
      matchesCategory = r.file_type === 'Prescription';
    } else if (selectedCategory === 'Lab Reports') {
      matchesCategory = r.file_type === 'Lab Report';
    }
    return matchesSearch && matchesCategory;
  });

  if (!isLoggedIn) {
    return (
      <div className="animate-slide-up" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Lock size={64} color="#64748b" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>{t('home.lockedText')}</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{t('home.guestDesc')}</p>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/auth')}>
          {t('auth.loginBtn')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={28} color="#06b6d4" /> {t('records.title')}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          {t('records.subtitle')}
        </p>
      </header>

      {error && (
        <div className="card" style={{ borderTop: '3px solid #ef4444', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="record-upload" className="upload-area" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
          {isUploading
            ? <><Loader size={40} style={{ color: '#64748b', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} /></>
            : <UploadCloud size={40} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
          }
          <span className="upload-text">{isUploading ? t('records.uploading') : t('records.uploadBtn')}</span>
          <span className="upload-hint">{t('records.uploadHint')}</span>
          <input
            id="record-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Filter and Search Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder={t('records.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`btn ${selectedCategory === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              {t('records.filterAll')}
            </button>
            <button
              onClick={() => setSelectedCategory('Prescriptions')}
              className={`btn ${selectedCategory === 'Prescriptions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              {t('records.filterPrescriptions')}
            </button>
            <button
              onClick={() => setSelectedCategory('Lab Reports')}
              className={`btn ${selectedCategory === 'Lab Reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              {t('records.filterReports')}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>
          📁 {t('records.yourFiles')} ({isLoading ? '...' : filteredRecords.length})
        </h2>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gap: '0.75rem', alignItems: 'center', color: '#64748b' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            {t('records.loading')}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">{t('records.empty')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredRecords.map((r) => (
              <div key={r.id} className="info-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} color="#06b6d4" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{r.original_filename}</h4>
                    <p style={{ fontSize: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span className="tag tag-blue">
                        {r.file_type === 'Prescription' ? t('records.typePrescription') : t('records.typeReport')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      <span>{formatFileSize(r.file_size)}</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleView(r.id)}
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  >
                    <Eye size={14} /> {t('records.viewBtn')}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', opacity: deletingId === r.id ? 0.5 : 1 }}
                  >
                    {deletingId === r.id
                      ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Trash2 size={14} />
                    }
                    {t('records.deleteBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
