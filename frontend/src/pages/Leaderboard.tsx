import React from 'react';
import Leaderboard from '../components/Dashboard/Leaderboard';

const LeaderboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Leaderboard</h1>
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage; 