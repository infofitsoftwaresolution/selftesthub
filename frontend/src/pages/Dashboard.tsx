import React from 'react';
import QuickStats from '../components/Dashboard/QuickStats';
import AvailableQuizzes from '../components/Dashboard/AvailableQuizzes';
import PerformanceChart from '../components/Dashboard/PerformanceChart';
import Leaderboard from '../components/Dashboard/Leaderboard';

const Dashboard: React.FC = () => {
  const userName = "Student"; // TODO: Get from user context

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            Ready to test your knowledge today?
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-4 sm:mb-8">
          <QuickStats />
        </div>

        {/* Available Quizzes Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
            Available Quizzes
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6">
            <AvailableQuizzes />
          </div>
        </div>

        {/* Performance and Leaderboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
              Performance Overview
            </h2>
            <div className="h-[300px] sm:h-[400px]">
              <PerformanceChart />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
              Leaderboard
            </h2>
            <div className="h-[300px] sm:h-[400px] overflow-y-auto">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 