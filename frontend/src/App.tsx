import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import Profile from './pages/Profile';
import Login from './pages/Login/index';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AvailableQuizzes from './components/Dashboard/AvailableQuizzes';
import QuizInterface from './components/Quiz/QuizInterface';
import QuizResult from './components/Quiz/QuizResult';
import MyResults from './components/Dashboard/MyResults';
import StudentReports from './components/Admin/StudentReports';
import Features from './pages/Features';
import QuizReports from './components/Admin/QuizReports';
import LeaderboardPage from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes of */}
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
            <Route path="/admin/quizzes" element={<ManageQuizzes />} />
            <Route path="/admin/students" element={<StudentReports />} />
            <Route path="/admin/quiz-reports" element={<QuizReports />} />
            <Route path="/profile" element={<Profile />} />
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