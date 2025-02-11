import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import UserProfile from '../components/Profile/UserProfile';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ManageQuizzes from '../pages/admin/ManageQuizzes';
import StudentReports from '../components/Admin/StudentReports';
import About from '../pages/About';
import Contact from '../pages/Contact';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* Admin Routes */}
          <Route path="/admin/quizzes" element={<ManageQuizzes />} />
          <Route path="/admin/students" element={<StudentReports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; 