import React, { useState, useEffect } from 'react';
import { FaMedal, FaCrown, FaStar, FaChartLine, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS, fetchOptions, getSecureUrl1 } from '../../config/api';
import PageLoader from '../common/PageLoader';
interface LeaderboardEntry {
  user_id: number;
  full_name: string;
  score: number;
  percentile: number;
  quiz_title: string;
  completed_at: string;
  rank: number;
  profile_image?: string;
}

interface QuizOption {
  id: string;
  title: string;
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchLeaderboardData();
  }, [selectedQuiz, timeRange]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.QUIZZES, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        // Silently set empty — no quizzes is not an error
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = getSecureUrl1(API_ENDPOINTS.LEADERBOARD);
      const queryParams = new URLSearchParams({
        quiz_id: selectedQuiz,
        time_range: timeRange
      }).toString();
      
      const url = `${baseUrl}?${queryParams}`;
      
      const response = await fetch(
        url,
        {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        // If no data or server error, show empty leaderboard instead of error
        setLeaderboardData([]);
        return;
      }
      
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Show empty state instead of error message
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-400 text-xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-xl" />;
      case 3:
        return <FaMedal className="text-amber-600 text-xl" />;
      default:
        return <FaStar className="text-blue-400 text-lg" />;
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-500';
    if (percentile >= 75) return 'text-blue-500';
    if (percentile >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-gray-500 text-center py-8">
          No leaderboard data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Leaderboard</h2>
        <div className="flex space-x-2">
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Quizzes</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentile</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboardData.map((entry) => (
              <tr
                key={entry.user_id}
                className={`${
                  entry.user_id === user?.id ? 'bg-blue-50' : ''
                } hover:bg-gray-50 transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {getBadge(entry.rank)}
                    <span className="ml-2 text-sm font-medium text-gray-900">{entry.rank}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {entry.profile_image ? (
                      <img
                        src={entry.profile_image}
                        alt={entry.full_name}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <FaUserCircle className="w-8 h-8 text-gray-400 mr-3" />
                    )}
                    <div className="text-sm font-medium text-gray-900">{entry.full_name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaChartLine className="text-blue-500 mr-1" />
                    <span className="text-sm text-gray-900">{entry.score}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getPercentileColor(entry.percentile)}`}>
                    {entry.percentile}th
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{entry.quiz_title}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboardData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No leaderboard data available for the selected criteria
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 