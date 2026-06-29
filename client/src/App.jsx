import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useContext } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import StatusPage from './pages/StatusPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QueuePage from './pages/admin/QueuePage';
import ReviewPage from './pages/admin/ReviewPage';
import AuditLogPage from './pages/admin/AuditLogPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="status/:id" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="review/:id" element={<ReviewPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-on-background">Loading VerifyFlow...</div>;
  }

  return (
    <Router>
      <AppRoutes />
      <Toaster position="top-right" />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
