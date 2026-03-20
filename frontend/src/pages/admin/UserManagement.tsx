import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_USER_ROLE(userId.toString()), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_superuser: !currentStatus })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh list
      } else {
        const data = await response.json();
        const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        alert(errorMsg || 'Failed to update user role');
      }
    } catch (err) {
      alert('Error updating user role');
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="text-sm text-gray-500">
          SuperAdmin View: <span className="font-bold text-blue-600">{currentUser?.email}</span>
        </div>
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
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-5">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 mr-3 flex items-center justify-center text-white font-bold">
                      {u.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                    u.email === 'infofitsoftware@gmail.com' 
                      ? 'bg-purple-100 text-purple-700' 
                      : u.is_superuser 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.email === 'infofitsoftware@gmail.com' ? 'Master SuperAdmin' : u.is_superuser ? 'Admin' : 'Student'}
                  </span>
                </td>
                <td className="p-5">
                  <span className={`flex items-center text-xs font-bold ${u.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${u.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-5 text-right">
                  {u.email !== 'infofitsoftware@gmail.com' && (
                    <button 
                      onClick={() => handleToggleRole(u.id, u.is_superuser)}
                      className={`font-bold text-sm transition-colors ${
                        u.is_superuser 
                          ? 'text-red-500 hover:text-red-700' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      {u.is_superuser ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
