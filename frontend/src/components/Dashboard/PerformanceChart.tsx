import React from 'react';
import { FaChartBar } from 'react-icons/fa';

const PerformanceChart: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <FaChartBar className="text-5xl text-gray-300 mb-4" />
      <p className="text-gray-500 font-medium">No performance data yet</p>
      <p className="text-gray-400 text-sm mt-1">
        Complete a quiz to see your performance overview here.
      </p>
    </div>
  );
};

export default PerformanceChart;