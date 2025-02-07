import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickStats from '../components/Dashboard/QuickStats';
import AvailableQuizzes from '../components/Dashboard/AvailableQuizzes';
import PerformanceChart from '../components/Dashboard/PerformanceChart';
import Leaderboard from '../components/Dashboard/Leaderboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = "Student"; // TODO: Get from user context

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Ready to test your knowledge today?
          </p>
        </div>

        {/* Quick Stats Grid */}
        <QuickStats />

        {/* Available Quizzes Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Available Quizzes
          </h2>
          <AvailableQuizzes />
        </div>

        {/* Performance and Leaderboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Performance Overview
            </h2>
            <PerformanceChart />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Leaderboard
            </h2>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 