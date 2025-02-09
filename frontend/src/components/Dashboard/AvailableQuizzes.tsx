import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaQuestionCircle, FaPlay } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import { Quiz } from '../../types/quiz';

const AvailableQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quizId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz-attempts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quiz_id: quizId })
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/quiz/${quizId}`, {
          state: {
            attemptId: data.id,
            startedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
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
                onClick={() => handleStartQuiz(quiz.id)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                <FaPlay className="h-4 w-4 mr-2" />
                Start Quiz
              </button>
            </div>
          </div>
        ))}
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