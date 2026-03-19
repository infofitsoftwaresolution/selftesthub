import React from 'react';
import { FaChartLine, FaUsers, FaClipboardList } from 'react-icons/fa';

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Total Students</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">124</h3>
            </div>
            <FaUsers className="text-3xl text-blue-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Active Quizzes</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">12</h3>
            </div>
            <FaClipboardList className="text-3xl text-green-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Avg. Performance</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">76%</h3>
            </div>
            <FaChartLine className="text-3xl text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Create New Quiz</button>
          <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition">View Student Reports</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
