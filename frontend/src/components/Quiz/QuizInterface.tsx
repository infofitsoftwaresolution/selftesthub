import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import TimerDebug from './TimerDebug';
import { Quiz, Question } from '../../types/quiz';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

const QuizInterface: React.FC = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // Start quiz and get attempt ID
  useEffect(() => {
    const startQuiz = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.START_QUIZ(quizId as string), {
          method: 'POST',
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAttemptId(data.attemptId);
        } else {
          throw new Error('Failed to start quiz');
        }
      } catch (error) {
        console.error('Error starting quiz:', error);
        navigate('/available-quizzes');
      }
    };

    if (quizId && !attemptId) {
      startQuiz();
    }
  }, [quizId, navigate]);

  // Add submit handler
  const handleSubmit = useCallback(async () => {
    if (!attemptId) {
      alert('No active quiz attempt found');
      return;
    }

    if (!window.confirm('Are you sure you want to submit the quiz?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.SUBMIT_QUIZ(quizId as string, attemptId.toString()), {
        method: 'POST',
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const result = await response.json();
        navigate('/quiz-result', { state: { result } });
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, quizId, answers, navigate]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_ENDPOINTS.QUIZ(quizId as string), {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Ensure quiz_id is set for each question
          const quizWithIds = {
            ...data,
            questions: data.questions.map((q: Question) => ({
              ...q,
              quiz_id: parseInt(quizId as string)
            }))
          };
          setQuiz(quizWithIds);
          setTimeLeft(data.duration * 60); // Convert minutes to seconds
        } else {
          throw new Error('Failed to fetch quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Setup timer
  useEffect(() => {
    if (quiz) {
      const startTime = location.state?.startedAt 
        ? new Date(location.state.startedAt) 
        : new Date();

      const durationInMs = quiz.duration * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationInMs);
      
      const initialRemaining = Math.max(0, Math.floor((endTime.getTime() - new Date().getTime()) / 1000));
      setTimeLeft(initialRemaining);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz]);

  // Add answer handler with auto-navigation
  const handleAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    
    setTimeout(() => {
      if (questionIndex < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestion(questionIndex + 1);
      }
    }, 500);
  }, [quiz?.questions.length]);

  if (isSubmitting || !quiz) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz?.title}</h1>
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              Question {currentQuestion + 1} of {quiz?.questions.length}
            </div>
            <div className="text-gray-600 font-semibold">
              Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Question Card */}
        {quiz && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl text-gray-800 mb-6">
              {quiz.questions[currentQuestion].text}
            </h2>
            
            <div className="space-y-4">
              {quiz.questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion, index)}
                  className={`w-full p-4 text-left rounded-lg transition-all duration-200 ${
                    answers[currentQuestion] === index 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  } border-2`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                      answers[currentQuestion] === index 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation and Submit */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className={`px-6 py-2 rounded-lg ${
              currentQuestion === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Previous
          </button>

          {currentQuestion === (quiz?.questions.length || 0) - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={currentQuestion === (quiz?.questions.length || 0) - 1}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Navigation Pills */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {quiz?.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentQuestion === index
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* <TimerDebug 
          quiz={quiz}
          startTime={location.state?.startedAt ? new Date(location.state.startedAt) : null}
          timeRemaining={timeLeft}
        /> */}
      </div>
    </div>
  );
};

export default QuizInterface; 