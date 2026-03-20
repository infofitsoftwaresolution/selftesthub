import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface StudentStats {
  completed_quizzes: number;
  best_score: number;
  avg_time_minutes: number;
  accuracy: number;
}

const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<StudentStats | null>(null);
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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    {
      title: 'Completed Quizzes',
      value: stats?.completed_quizzes ?? 0,
      icon: '✅',
    },
    {
      title: 'Best Score',
      value: stats?.best_score ? `${stats.best_score}%` : '—',
      icon: '🎯',
    },
    {
      title: 'Average Time',
      value: stats?.avg_time_minutes ? `${stats.avg_time_minutes} min` : '—',
      icon: '⏱️',
    },
    {
      title: 'Accuracy',
      value: stats?.accuracy ? `${stats.accuracy}%` : '—',
      icon: '📊',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayStats.map((stat, index) => (
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