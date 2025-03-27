import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';


interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: number;
  title: string;
  duration: number;
  questions: Question[];
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  quiz?: Quiz;
  started_at: string;
  completed_at: string;
  answers: Record<string, number>;
  score: number;
}

const MyResults: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_RESULTS, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched attempts data:', data); // Debug log

      // Fetch quiz details for each attempt
      const attemptsWithQuizzes = await Promise.all(
        data.map(async (attempt: QuizAttempt) => {
          if (!attempt.quiz?.id) {
            console.error('Attempt missing quiz.id:', attempt);
            return attempt;
          }

          try {
            console.log('Fetching quiz details for quiz.id:', attempt.quiz.id); // Debug log
            // Use the QUIZ endpoint instead of QUIZ_RESULTS
            const quizResponse = await fetch(API_ENDPOINTS.QUIZ(attempt.quiz.id.toString()), {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (!quizResponse.ok) {
              console.error(`Failed to fetch quiz ${attempt.quiz.id}:`, quizResponse.status);
              return attempt;
            }

            const quizData = await quizResponse.json();
            console.log('Fetched quiz data:', quizData); // Debug log
            
            // Merge the quiz data with the attempt
            const updatedAttempt = {
              ...attempt,
              quiz: {
                ...attempt.quiz,
                questions: quizData.questions || []
              }
            };
            console.log('Updated attempt with quiz data:', updatedAttempt); // Debug log
            return updatedAttempt;
          } catch (error) {
            console.error(`Failed to fetch quiz ${attempt.quiz.id}:`, error);
          }
          return attempt;
        })
      );

      // Filter out attempts without quiz data
      const validAttempts = attemptsWithQuizzes.filter(attempt => attempt.quiz);
      console.log('Valid attempts:', validAttempts); // Debug log
      setAttempts(validAttempts);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeTaken = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / (1000 * 60));
    return `${minutes} minutes`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">My Quiz Results</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">You haven't completed any quizzes yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">My Quiz Results</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="md:col-span-1 space-y-4">
          {attempts.map((attempt) => {
            if (!attempt.quiz) return null;
            return (
              <div
                key={attempt.id}
                onClick={() => {
                  console.log('Selected attempt:', attempt); // Debug log
                  setSelectedAttempt(attempt);
                }}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedAttempt?.id === attempt.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">{attempt.quiz.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Score: {attempt.score}%</p>
                  <p>Date: {formatDate(attempt.completed_at)}</p>
                  <p>Time Taken: {calculateTimeTaken(attempt.started_at, attempt.completed_at)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed View */}
        <div className="md:col-span-2">
          {selectedAttempt?.quiz ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold">{selectedAttempt.quiz.title}</h3>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaClock className="mr-1" />
                    {calculateTimeTaken(selectedAttempt.started_at, selectedAttempt.completed_at)}
                  </div>
                  <div>Score: {selectedAttempt.score}%</div>
                </div>
              </div>

              <div className="space-y-6">
                {selectedAttempt.quiz.questions && selectedAttempt.quiz.questions.length > 0 ? (
                  selectedAttempt.quiz.questions.map((question, index) => {
                    const userAnswer = selectedAttempt.answers[index.toString()];
                    const isCorrect = userAnswer === question.correctAnswer;

                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium mb-2">
                              Question {index + 1}: {question.text}
                            </p>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded ${
                                    optIndex === question.correctAnswer
                                      ? 'bg-green-50 border border-green-200'
                                      : optIndex === userAnswer
                                      ? 'bg-red-50 border border-red-200'
                                      : 'bg-gray-50'
                                  }`}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="ml-4">
                            {isCorrect ? (
                              <FaCheck className="text-green-500 text-xl" />
                            ) : (
                              <FaTimes className="text-red-500 text-xl" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500">
                    No questions available for this quiz
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a quiz attempt to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyResults; 