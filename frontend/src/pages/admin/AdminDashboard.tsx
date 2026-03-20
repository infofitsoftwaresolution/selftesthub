import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsers, FaClipboardList } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface AdminStats {
  total_students: number;
  active_quizzes: number;
  avg_performance: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Total Students</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats?.total_students ?? 0}</h3>
              )}
            </div>
            <FaUsers className="text-3xl text-blue-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Active Quizzes</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats?.active_quizzes ?? 0}</h3>
              )}
            </div>
            <FaClipboardList className="text-3xl text-green-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Avg. Performance</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stats?.avg_performance ?? 0}%</h3>
              )}
            </div>
            <FaChartLine className="text-3xl text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create New Quiz
          </button>
          <button
            onClick={() => navigate('/admin/students')}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            View Student Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
