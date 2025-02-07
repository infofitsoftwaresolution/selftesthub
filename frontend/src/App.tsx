import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import UserProfile from './components/Profile/UserProfile';
import Login from './pages/Login/index';
import Home from './pages/Home';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AvailableQuizzes from './components/Dashboard/AvailableQuizzes';
import QuizInterface from './components/Quiz/QuizInterface';
import QuizResult from './components/Quiz/QuizResult';
import MyResults from './components/Dashboard/MyResults';
import StudentReports from './components/Admin/StudentReports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with DashboardLayout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-results" element={<MyResults />} />
          <Route path="/available-quizzes" element={<AvailableQuizzes />} />
          <Route path="/admin/quizzes" element={<ManageQuizzes />} />
          <Route path="/admin/students" element={<StudentReports />} />
          <Route path="/profile" element={<UserProfile />} />
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
  );
}

export default App; 