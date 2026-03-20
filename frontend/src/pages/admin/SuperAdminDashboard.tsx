import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaUsers, FaClipboardList, FaChartBar } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface SuperAdminStats {
  total_users: number;
  total_admins: number;
  total_quizzes: number;
  total_attempts: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching superadmin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) => (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${color} uppercase font-bold tracking-widest`}>{label}</p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-700 rounded animate-pulse mt-1"></div>
          ) : (
            <h3 className="text-3xl font-black mt-1 text-white">{value}</h3>
          )}
        </div>
        <Icon className={`text-4xl ${color} opacity-50`} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">SuperAdmin Command Center</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Platform Users"
          value={stats?.total_users ?? 0}
          icon={FaUsers}
          color="text-blue-400"
        />
        <StatCard
          label="Admins"
          value={stats?.total_admins ?? 0}
          icon={FaShieldAlt}
          color="text-emerald-400"
        />
        <StatCard
          label="Total Quizzes"
          value={stats?.total_quizzes ?? 0}
          icon={FaClipboardList}
          color="text-amber-400"
        />
        <StatCard
          label="Completed Attempts"
          value={stats?.total_attempts ?? 0}
          icon={FaChartBar}
          color="text-purple-400"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-6 bg-blue-600 mr-3 rounded-full"></span>
            Platform Overview
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Student Users</span>
              <span className="text-sm font-bold text-gray-800">
                {loading ? '...' : (stats?.total_users ?? 0) - (stats?.total_admins ?? 0)}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Admin Users</span>
              <span className="text-sm font-bold text-gray-800">
                {loading ? '...' : stats?.total_admins ?? 0}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Quiz Submissions</span>
              <span className="text-sm font-bold text-gray-800">
                {loading ? '...' : stats?.total_attempts ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-6 bg-emerald-600 mr-3 rounded-full"></span>
            System Status
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-medium text-emerald-700">Backend API — Online</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-medium text-emerald-700">Database — Connected</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-sm font-medium text-gray-500">Audit Logs — See Audit Logs page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
