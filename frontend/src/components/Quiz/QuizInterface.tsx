import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import TimerDebug from './TimerDebug';
import { Quiz, Question } from '../../types/quiz';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import QuizSecurity from './QuizSecurity';

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
  const [securityViolation, setSecurityViolation] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Add useEffect for timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Modify handleSubmit to handle auto-submission
  const handleSubmit = async () => {
    if (isSubmitting || !attemptId) return;

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

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      
      // We must append 'Z' because the backend sends naive UTC dates without timezones
      // e.g., '2026-03-20T06:30:00'. Without 'Z', JavaScript parses it as local time!
      const formatAsUTC = (dateStr: string) => dateStr && !dateStr.endsWith('Z') ? `${dateStr}Z` : dateStr;

      let startTime = result.started_at
          ? formatAsUTC(result.started_at)
          : location.state?.startedAt 
            ? location.state.startedAt 
            : new Date(new Date().getTime() - ((quiz?.duration || 30) * 60 * 1000)).toISOString();
      
      const endTime = result.completed_at ? formatAsUTC(result.completed_at) : new Date().toISOString();
      
      const resultWithTimestamps = {
        ...result,
        started_at: startTime,
        completed_at: endTime
      };
      
      navigate('/quiz-result', { state: { result: resultWithTimestamps } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Add security violation handler
  const handleSecurityViolation = useCallback(async () => {
    setSecurityViolation(true);
    if (attemptId) {
      try {
        // Submit the quiz with current answers
        const formattedAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
          acc[key.toString()] = value;
          return acc;
        }, {} as Record<string, number>);

        await fetch(API_ENDPOINTS.SUBMIT_QUIZ(quizId as string, attemptId.toString()), {
          method: 'POST',
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            answers: formattedAnswers,
            security_violation: true 
          })
        });

        alert('Quiz submitted due to security violation. Minimizing the window or switching tabs is not allowed.');
        navigate('/available-quizzes');
      } catch (error) {
        console.error('Error submitting quiz after security violation:', error);
      }
    }
  }, [attemptId, quizId, answers, navigate]);

  // Add right-click and copy prevention
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();

    // Prevent right-click
    document.addEventListener('contextmenu', preventDefault);
    
    // Prevent copy
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('paste', preventCopy);

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);

  if (isSubmitting || !quiz) return <div>Loading...</div>;
  if (securityViolation) return <div>Submitting quiz due to security violation...</div>;

  return (
    <QuizSecurity 
      onViolation={handleSecurityViolation}
    >
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

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Question Card */}
          {quiz && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl text-gray-800 mb-6 whitespace-pre-wrap">
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
                    <div className="flex items-start">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 mt-1 flex-shrink-0 ${
                        answers[currentQuestion] === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="whitespace-pre-wrap">{option}</div>
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
    </QuizSecurity>
  );
};

export default QuizInterface; 