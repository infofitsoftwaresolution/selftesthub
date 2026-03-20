import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaBook, FaTrophy, FaUser, FaChartBar, FaBars, FaTimes, FaCrown, FaShieldAlt, FaHistory, FaColumns, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 text-sm font-medium ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <span className="mr-3 text-base">{icon}</span>
    <span>{text}</span>
  </Link>
);

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: 'SuperAdmin', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (isAdmin) return { label: 'Admin', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Student', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
      >
        {isSidebarOpen ? (
          <FaTimes className="w-6 h-6 text-gray-600" />
        ) : (
          <FaBars className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Branding */}
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SelfTestHub
          </h1>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name || 'User'}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Student Section */}
          <div className="mb-1">
            <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main</p>
            <SidebarItem
              to="/dashboard"
              icon={<FaHome />}
              text="Dashboard"
              isActive={location.pathname === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)}
            />
            <SidebarItem
              to="/available-quizzes"
              icon={<FaBook />}
              text="Available Quizzes"
              isActive={location.pathname === '/available-quizzes'}
              onClick={() => setIsSidebarOpen(false)}
            />
            <SidebarItem
              to="/my-results"
              icon={<FaTrophy />}
              text="My Results"
              isActive={location.pathname === '/my-results'}
              onClick={() => setIsSidebarOpen(false)}
            />
            <SidebarItem
              to="/leaderboard"
              icon={<FaCrown />}
              text="Leaderboard"
              isActive={location.pathname === '/leaderboard'}
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="px-3 mb-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest">Admin Panel</p>
              <SidebarItem
                to="/admin"
                icon={<FaColumns />}
                text="Admin Dashboard"
                isActive={location.pathname === '/admin'}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to="/admin/quizzes"
                icon={<FaBook />}
                text="Manage Quizzes"
                isActive={location.pathname === '/admin/quizzes'}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to="/admin/students"
                icon={<FaUser />}
                text="Student Reports"
                isActive={location.pathname === '/admin/students'}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to="/admin/quiz-reports"
                icon={<FaChartBar />}
                text="Quiz Reports"
                isActive={location.pathname === '/admin/quiz-reports'}
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          )}

          {/* SuperAdmin Section */}
          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="mx-2 mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FaShieldAlt className="text-purple-400" />
                  SuperAdmin
                </p>
              </div>
              <SidebarItem
                to="/superadmin"
                icon={<FaShieldAlt />}
                text="Command Center"
                isActive={location.pathname === '/superadmin'}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to="/admin/users"
                icon={<FaUsers />}
                text="User Management"
                isActive={location.pathname === '/admin/users'}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                to="/admin/audit-logs"
                icon={<FaHistory />}
                text="Audit Logs"
                isActive={location.pathname === '/admin/audit-logs'}
                onClick={() => setIsSidebarOpen(false)}
              />
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100">
          <Link
            to="/profile"
            className="flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FaUser className="mr-3" />
            <span>Profile Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <FaSignOutAlt className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main key={location.pathname} className="p-4 lg:p-6" style={{ animation: 'globalFadeIn 0.4s ease-out forwards' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;