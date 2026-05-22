import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SymptomAnalysis from './pages/SymptomAnalysis';
import TabletInfo from './pages/TabletInfo';
import ImageDiagnosis from './pages/ImageDiagnosis';
import DiseaseCure from './pages/DiseaseCure';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import MedicalRecords from './pages/MedicalRecords';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected Routes */}
                <Route path="/symptoms" element={<ProtectedRoute><SymptomAnalysis /></ProtectedRoute>} />
                <Route path="/medicine" element={<ProtectedRoute><TabletInfo /></ProtectedRoute>} />
                <Route path="/diagnosis" element={<ProtectedRoute><ImageDiagnosis /></ProtectedRoute>} />
                <Route path="/cures" element={<ProtectedRoute><DiseaseCure /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/records" element={<ProtectedRoute><MedicalRecords /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
