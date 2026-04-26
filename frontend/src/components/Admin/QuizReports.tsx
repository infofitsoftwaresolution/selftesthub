import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PageLoader from '../common/PageLoader';

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface Quiz {
  id: number;
  title: string;
  duration: number;
  type?: string;
}

interface QuizAttempt {
  id: number;
  user: User;
  quiz: Quiz;
  started_at: string;
  completed_at: string;
  score: number | null;
  answers: Record<string, number>;
  video_url?: string;
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

const getCappedTimeTaken = (start: string, end: string, duration: number) => {
  const startTime = new Date(formatAsUTC(start)).getTime();
  const endTime = new Date(formatAsUTC(end)).getTime();
  const minutes = Math.max(0, Math.round((endTime - startTime) / 60000));
  return Math.min(minutes, duration);
};

const QuizReports: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('completed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedQuiz, setSelectedQuiz] = useState<number | 'all'>('all');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [updatingAttemptId, setUpdatingAttemptId] = useState<number | null>(null);

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

  const handleUpdateScore = async (attemptId: number, newScore: number) => {
    try {
      setUpdatingAttemptId(attemptId);
      const response = await fetch(API_ENDPOINTS.UPDATE_REPORT_SCORE(attemptId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score: newScore })
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      const updatedAttempts = attempts.map((a) =>
        a.id === attemptId ? { ...a, score: newScore } : a
      );
      setAttempts(updatedAttempts);
      if (selectedQuiz !== 'all') {
        calculateQuizStats(updatedAttempts);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update score');
    } finally {
      setUpdatingAttemptId(null);
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

    const scoredAttempts = attemptData.filter(a => a.score !== null && !(a.video_url && a.score === 0));
    const scores = scoredAttempts.map(a => Number(a.score));
    const timeTaken = attemptData.map(a => 
      getCappedTimeTaken(a.started_at, a.completed_at, a.quiz.duration)
    );

    const stats: QuizStats = {
      averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length ? Math.max(...scores) : 0,
      lowestScore: scores.length ? Math.min(...scores) : 0,
      totalAttempts: attemptData.length,
      averageTimeTaken: timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length
    };

    setQuizStats(stats);
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
        return (((a.video_url && a.score === 0) ? -1 : (a.score ?? -1)) - ((b.video_url && b.score === 0) ? -1 : (b.score ?? -1))) * multiplier;
      case 'time_taken':
        return (
          (getCappedTimeTaken(a.started_at, a.completed_at, a.quiz.duration) -
            getCappedTimeTaken(b.started_at, b.completed_at, b.quiz.duration)) *
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

  const selectedQuizMeta = selectedQuiz === 'all'
    ? null
    : quizzes.find((quiz) => quiz.id === selectedQuiz) || null;
  const canAssignScore = selectedQuiz !== 'all' && selectedQuizMeta?.type === 'video';

  if (loading) return <PageLoader />;
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
                  ((sortedAttempts.filter(a => a.score !== null && !(a.video_url && a.score === 0) && a.score >= 70).length / sortedAttempts.length) * 100).toFixed(1)
                }%</p>
                <p>Fail Rate: {
                  ((sortedAttempts.filter(a => a.score !== null && !(a.video_url && a.score === 0) && a.score < 70).length / sortedAttempts.length) * 100).toFixed(1)
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
                  {attempt.score === null || (attempt.video_url && attempt.score === 0) ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                      TBD
                    </span>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      attempt.score >= 70 ? 'bg-green-100 text-green-800' :
                      attempt.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {attempt.score}%
                    </span>
                  )}
                  {attempt.video_url && canAssignScore && (
                    <div className="mt-2">
                      <select
                        className="text-xs border border-gray-300 rounded p-1 bg-white"
                        value={attempt.score === null || attempt.score === 0 ? '' : attempt.score}
                        disabled={updatingAttemptId === attempt.id}
                        onChange={(e) => handleUpdateScore(attempt.id, Number(e.target.value))}
                      >
                        <option value="" disabled>
                          {updatingAttemptId === attempt.id ? 'Saving...' : 'Assign score'}
                        </option>
                        <option value={100}>Excellent (100%)</option>
                        <option value={80}>Good (80%)</option>
                        <option value={50}>Not Good Not Bad (50%)</option>
                        <option value={30}>Bad (30%)</option>
                        <option value={10}>Very Bad (10%)</option>
                      </select>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCappedTimeTaken(attempt.started_at, attempt.completed_at, attempt.quiz.duration)} minutes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(formatAsUTC(attempt.completed_at)).toLocaleDateString('en-IN')}
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