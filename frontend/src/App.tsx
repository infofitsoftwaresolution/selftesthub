import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import Profile from './pages/Profile';
import Login from './pages/Login/index';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import RoleBasedRoute from './components/Auth/RoleBasedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';
import LeaderboardPage from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with DashboardLayout */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-results" element={<MyResults />} />
            <Route path="/available-quizzes" element={<AvailableQuizzes />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Only Routes */}
            <Route element={<RoleBasedRoute requiredRoles={['admin', 'superadmin']}><Outlet /></RoleBasedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/quizzes" element={<ManageQuizzes />} />
              <Route path="/admin/students" element={<StudentReports />} />
              <Route path="/admin/quiz-reports" element={<QuizReports />} />
            </Route>

            {/* SuperAdmin Only Routes */}
            <Route element={<RoleBasedRoute requiredRoles={['superadmin']}><Outlet /></RoleBasedRoute>}>
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>

          {/* Standalone Protected Routes */}
          <Route path="/quiz/:quizId" element={
            <ProtectedRoute>
              <QuizInterface />
            </ProtectedRoute>
          } />
          <Route path="/quiz-result" element={
            <ProtectedRoute>
              <QuizResult />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App; 