import React from 'react';

const QuickStats: React.FC = () => {
  const stats = [
    {
      title: 'Completed Quizzes',
      value: '5',
      icon: '✅',
    },
    {
      title: 'Best Score',
      value: '92%',
      icon: '🎯',
    },
    {
      title: 'Average Time',
      value: '8 min',
      icon: '⏱️',
    },
    {
      title: 'Accuracy',
      value: '89%',
      icon: '📊',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform duration-300 hover:transform hover:scale-105"
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">{stat.icon}</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats; 