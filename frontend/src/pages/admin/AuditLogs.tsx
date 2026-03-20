import React from 'react';
import { FaHistory } from 'react-icons/fa';

const AuditLogs: React.FC = () => {
  return (
    <div className="p-6 text-gray-800">
      <h1 className="text-3xl font-black mb-10 tracking-tight">Audit & Activity Logs</h1>
      
      <div className="bg-white p-12 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
        <FaHistory className="text-5xl text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium text-lg">No audit logs recorded yet</p>
        <p className="text-gray-400 text-sm mt-2 max-w-md">
          Activity logs will appear here as admins and users perform important actions like role changes, quiz modifications, and system events.
        </p>
      </div>
    </div>
  );
};

export default AuditLogs;
