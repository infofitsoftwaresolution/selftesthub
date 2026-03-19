import React from 'react';

const AuditLogs: React.FC = () => {
  return (
    <div className="p-6 text-gray-800">
      <h1 className="text-3xl font-black mb-10 tracking-tight">Audit & Activity Logs</h1>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-12">
          {/* Today Block */}
          <div>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-12 mb-6">Today</h2>
            
            <div className="relative ml-12 bg-white p-6 rounded-2xl shadow-md border border-gray-100 group hover:shadow-xl transition-all duration-300">
              <div className="absolute -left-[50px] top-6 w-5 h-5 bg-white border-4 border-blue-500 rounded-full z-10"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold leading-tight group-hover:text-blue-600 transition-colors">SuperAdmin modified quiz "AWS Certified Solutions Architect"</p>
                  <p className="text-xs text-gray-400 mt-1">IP: 13.201.50.33 • Chrome 122.0.0</p>
                </div>
                <span className="text-xs font-mono text-gray-400">14:02 PM</span>
              </div>
            </div>

            <div className="relative mt-4 ml-12 bg-white p-6 rounded-2xl shadow-md border border-gray-100 group hover:shadow-xl transition-all duration-300">
              <div className="absolute -left-[50px] top-6 w-5 h-5 bg-white border-4 border-orange-500 rounded-full z-10"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold leading-tight group-hover:text-orange-600 transition-colors">Admin "Venkatesh" authorized a new student login</p>
                  <p className="text-xs text-gray-400 mt-1">IP: 122.161.50.11 • Edge 121.0.0</p>
                </div>
                <span className="text-xs font-mono text-gray-400">09:45 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
