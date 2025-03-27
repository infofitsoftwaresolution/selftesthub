import React from 'react';
import { FaUsers, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';

const stats = [
  {
    icon: <FaUsers className="w-8 h-8" />,
    value: "10,000+",
    label: "Active Users"
  },
  {
    icon: <FaQuestionCircle className="w-8 h-8" />,
    value: "500+",
    label: "Available Quizzes"
  },
  {
    icon: <FaCheckCircle className="w-8 h-8" />,
    value: "1M+",
    label: "Quizzes Completed"
  }
];

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-blue-600 mb-4 flex justify-center">{stat.icon}</div>
              <div className="text-4xl font-bold text-blue-900 mb-2">{stat.value}</div>
              <div className="text-lg text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 