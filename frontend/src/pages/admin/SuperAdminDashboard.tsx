import React from 'react';
import { FaShieldAlt, FaDatabase, FaServer } from 'react-icons/fa';

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">SuperAdmin Command Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 uppercase font-bold tracking-widest">Platform Users</p>
              <h3 className="text-3xl font-black mt-1 text-white">1,240</h3>
            </div>
            <FaShieldAlt className="text-4xl text-blue-400 opacity-50" />
          </div>
          <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[70%]"></div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest">System Health</p>
              <h3 className="text-3xl font-black mt-1 text-white">99.9%</h3>
            </div>
            <FaServer className="text-4xl text-emerald-400 opacity-50" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs text-slate-400">All systems operational</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 uppercase font-bold tracking-widest">Global Traffic</p>
              <h3 className="text-3xl font-black mt-1 text-white">4.2 TB</h3>
            </div>
            <FaDatabase className="text-4xl text-amber-400 opacity-50" />
          </div>
          <p className="mt-4 text-xs text-slate-400">Database load: 24%</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-6 bg-blue-600 mr-3 rounded-full"></span>
            System Logs
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-600">Database migration successful</span>
              <span className="text-xs text-gray-400">2 mins ago</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-600">New superadmin account detected</span>
              <span className="text-xs text-amber-500 font-bold">Security Alert</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
