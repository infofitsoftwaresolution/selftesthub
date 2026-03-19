import React from 'react';

const UserManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-lg transition">
          + Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <th className="p-5">User</th>
              <th className="p-5">Role</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="p-5">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 mr-3 flex items-center justify-center text-white font-bold">A</div>
                  <div>
                    <p className="font-bold text-gray-800">Akash Sharma</p>
                    <p className="text-xs text-gray-500">akash@example.com</p>
                  </div>
                </div>
              </td>
              <td className="p-5">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">SuperAdmin</span>
              </td>
              <td className="p-5">
                <span className="flex items-center text-xs text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  Online
                </span>
              </td>
              <td className="p-5 text-right">
                <button className="text-blue-600 hover:text-blue-800 font-bold text-sm mr-4">Edit</button>
                <button className="text-red-500 hover:text-red-700 font-bold text-sm">Suspend</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
