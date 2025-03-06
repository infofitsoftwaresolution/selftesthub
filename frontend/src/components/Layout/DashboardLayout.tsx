import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { FaHome, FaBook, FaTrophy, FaUser, FaChartBar } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text, isActive }) => (
  <Link
    to={to}
    className={`flex items-center p-3 mb-2 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
    }`}
  >
    <span className="mr-3">{icon}</span>
    <span>{text}</span>
  </Link>
);

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.ME, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User Data:', userData);
          setIsAdmin(userData.is_superuser);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600">MCQ Exam</h1>
        </div>
        <nav className="p-4">
          <SidebarItem
            to="/dashboard"
            icon={<FaHome className="w-4 h-4 mr-2" />}
            text="Dashboard"
            isActive={location.pathname === '/dashboard'}
          />
          <SidebarItem
            to="/available-quizzes"
            icon={<FaBook className="w-4 h-4 mr-2" />}
            text="Available Quizzes"
            isActive={location.pathname === '/available-quizzes'}
          />
          <SidebarItem
            to="/my-results"
            icon={<FaTrophy className="w-4 h-4 mr-2" />}
            text="My Results"
            isActive={location.pathname === '/my-results'}
          />
          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-200"></div>
              <h2 className="mb-2 text-sm font-semibold text-gray-600">Admin</h2>
              <SidebarItem
                to="/admin/quizzes"
                icon={<FaBook className="w-4 h-4 mr-2" />}
                text="Manage Quizzes"
                isActive={location.pathname === '/admin/quizzes'}
              />
              <SidebarItem
                to="/admin/students"
                icon={<FaUser className="w-4 h-4 mr-2" />}
                text="Student Reports"
                isActive={location.pathname === '/admin/students'}
              />
              <SidebarItem
                to="/admin/quiz-reports"
                icon={<FaChartBar className="w-4 h-4 mr-2" />}
                text="Quiz Reports"
                isActive={location.pathname === '/admin/quiz-reports'}
              />
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="flex justify-end items-center px-6 py-4">
            <Link
              to="/profile"
              className="flex items-center text-gray-700 hover:text-blue-600"
            >
              <FaUser className="w-4 h-4 mr-2" />
              <span>Profile</span>
            </Link>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 