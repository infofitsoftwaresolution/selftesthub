import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaQuestionCircle, FaPlay, FaLock, FaVideo } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import { Quiz } from '../../types/quiz';

const AvailableQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
    fetchAttemptedQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ACTIVE_QUIZZES}/active`, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // No active quizzes isn't an error — show empty state
        setQuizzes([]);
        return;
      }

      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptedQuizzes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MY_ATTEMPTS, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const attemptedQuizIds = data.map((attempt: any) => attempt.quiz_id);
        setAttemptedQuizzes(attemptedQuizIds);
      }
    } catch (err) {
      console.error('Failed to fetch attempted quizzes:', err);
    }
  };

  const handleStartQuiz = async (quiz: any) => {
    try {
      const response = await fetch(API_ENDPOINTS.START_QUIZ(quiz.id.toString()), {
        method: 'POST',
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const path = quiz.type === 'video' ? `/quiz/${quiz.id}/video` : `/quiz/${quiz.id}`;
        navigate(path, {
          state: {
            attemptId: data.id,
            startedAt: new Date().toISOString()
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
      setError('Failed to start quiz');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const hasAttempted = attemptedQuizzes.includes(quiz.id);
          return (
            <div key={quiz.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <FaClock className="h-5 w-5 mr-2" />
                    <span>{quiz.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaQuestionCircle className="h-5 w-5 mr-2" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {quiz.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={hasAttempted}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition duration-300 ${
                    hasAttempted
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {hasAttempted ? (
                    <>
                      <FaLock className="h-4 w-4 mr-2" />
                      Already Attempted
                    </>
                  ) : quiz.type === 'video' ? (
                    <>
                      <FaVideo className="h-4 w-4 mr-2" />
                      Start Video Interview
                    </>
                  ) : (
                    <>
                      <FaPlay className="h-4 w-4 mr-2" />
                      Start Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!loading && quizzes.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No quizzes available at the moment.
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableQuizzes;