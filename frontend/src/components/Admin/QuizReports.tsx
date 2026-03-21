import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface Quiz {
  id: number;
  title: string;
  duration: number;
}

interface QuizAttempt {
  id: number;
  user: User;
  quiz: Quiz;
  started_at: string;
  completed_at: string;
  score: number;
  answers: Record<string, number>;
}

interface QuizStats {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalAttempts: number;
  averageTimeTaken: number;
}

type SortField = 'score' | 'time_taken' | 'completed_at';
type SortOrder = 'asc' | 'desc';

// Enforce UTC parsing for naive timestamps from backend
const formatAsUTC = (dateStr: string) => dateStr && !dateStr.endsWith('Z') ? `${dateStr}Z` : dateStr;

const QuizReports: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('completed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedQuiz, setSelectedQuiz] = useState<number | 'all'>('all');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [selectedQuiz]);

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
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      setError('Failed to load quizzes');
    }
  };

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const endpoint = selectedQuiz === 'all' 
        ? API_ENDPOINTS.QUIZ_REPORTS
        : `${API_ENDPOINTS.QUIZ_REPORTS}?quiz_id=${selectedQuiz}`;

      const response = await fetch(endpoint, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || 
          `Failed to fetch quiz attempts: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setAttempts(data);
      
      if (selectedQuiz !== 'all') {
        calculateQuizStats(data);
      } else {
        setQuizStats(null);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuizStats = (attemptData: QuizAttempt[]) => {
    if (attemptData.length === 0) {
      setQuizStats({
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalAttempts: 0,
        averageTimeTaken: 0
      });
      return;
    }

    const scores = attemptData.map(a => a.score);
    const timeTaken = attemptData.map(a => 
      getTimeTaken(a.started_at, a.completed_at)
    );

    const stats: QuizStats = {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      totalAttempts: attemptData.length,
      averageTimeTaken: timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length
    };

    setQuizStats(stats);
  };

  const getTimeTaken = (start: string, end: string) => {
    const startTime = new Date(formatAsUTC(start)).getTime();
    const endTime = new Date(formatAsUTC(end)).getTime();
    const minutes = Math.round((endTime - startTime) / 60000);
    return minutes;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'score':
        return (a.score - b.score) * multiplier;
      case 'time_taken':
        return (
          (getTimeTaken(a.started_at, a.completed_at) -
            getTimeTaken(b.started_at, b.completed_at)) *
          multiplier
        );
      case 'completed_at':
        return (
          (new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime()) *
          multiplier
        );
      default:
        return 0;
    }
  });

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Quiz Reports</h1>
        <div className="mb-4">
          <select
            className="border rounded-md p-2"
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Quizzes</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
            ))}
          </select>
        </div>

        {quizStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Performance Overview</h3>
              <div className="space-y-2">
                <p>Average Score: {quizStats.averageScore.toFixed(1)}%</p>
                <p>Highest Score: {quizStats.highestScore}%</p>
                <p>Lowest Score: {quizStats.lowestScore}%</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Participation</h3>
              <div className="space-y-2">
                <p>Total Attempts: {quizStats.totalAttempts}</p>
                <p>Average Time: {quizStats.averageTimeTaken.toFixed(1)} minutes</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Score Distribution</h3>
              <div className="space-y-2">
                <p>Pass Rate: {
                  ((sortedAttempts.filter(a => a.score >= 70).length / sortedAttempts.length) * 100).toFixed(1)
                }%</p>
                <p>Fail Rate: {
                  ((sortedAttempts.filter(a => a.score < 70).length / sortedAttempts.length) * 100).toFixed(1)
                }%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quiz Title
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('score')}
              >
                Score {getSortIcon('score')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('time_taken')}
              >
                Time Taken {getSortIcon('time_taken')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('completed_at')}
              >
                Completed At {getSortIcon('completed_at')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedAttempts.map((attempt) => (
              <tr key={attempt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {attempt.user.full_name}
                  </div>
                  <div className="text-sm text-gray-500">{attempt.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {attempt.quiz.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    attempt.score >= 70 ? 'bg-green-100 text-green-800' :
                    attempt.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {attempt.score}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTimeTaken(attempt.started_at, attempt.completed_at)} minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(formatAsUTC(attempt.completed_at)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizReports; 