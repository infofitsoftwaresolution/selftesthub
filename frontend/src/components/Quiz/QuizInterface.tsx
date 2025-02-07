import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TimerDebug from './TimerDebug';

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface Quiz {
  id: number;
  title: string;
  duration: number;
  questions: Question[];
  type: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
}

const QuizInterface: React.FC = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attemptId = location.state?.attemptId;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Add submit handler
  const handleSubmit = useCallback(async () => {
    if (!window.confirm('Are you sure you want to submit the quiz?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/v1/quiz-attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          answers,
          is_completed: true 
        })
      });

      if (response.ok) {
        const result = await response.json();
        navigate('/quiz-result', { state: { result } });
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  }, [attemptId, answers, navigate]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Quiz loaded:', data);
          setQuiz(data);
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
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
      setTimeRemaining(initialRemaining);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
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

  // Handle answer selection
  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading || !quiz) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-gray-100">
      {/* Header */}
      <div className="h-16 bg-white shadow-md flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-lg font-semibold">
            Time Left: {formatTime(timeRemaining || 0)}
          </div>
          {/* Add Submit Button */}
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Questions Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl mb-4">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </h2>
            <p className="text-lg mb-6">{quiz.questions[currentQuestion].text}</p>
            <div className="space-y-4">
              {quiz.questions[currentQuestion].options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswer(currentQuestion, index)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion] === index
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="w-80 bg-white shadow-lg p-6 overflow-auto">
          <h3 className="text-lg font-semibold mb-4">Questions Overview</h3>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  h-10 w-10 rounded-lg flex items-center justify-center font-medium
                  ${
                    currentQuestion === index
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== undefined
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
              <span>Not Attempted</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              <span>Current Question</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add TimerDebug component */}
      <TimerDebug 
        quiz={quiz}
        startTime={location.state?.startedAt ? new Date(location.state.startedAt) : null}
        timeRemaining={timeRemaining}
      />
    </div>
  );
};

export default QuizInterface; 