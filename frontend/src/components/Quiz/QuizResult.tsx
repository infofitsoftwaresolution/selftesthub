import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaArrowLeft } from 'react-icons/fa';

interface QuizResult {
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  started_at: string;
  completed_at: string;
}

const QuizResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as QuizResult;

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Result Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate time taken
  let timeTaken = "N/A";
  if (result.started_at && result.completed_at) {
    try {
      const startTime = new Date(result.started_at);
      const endTime = new Date(result.completed_at);
      
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        const timeTakenMs = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor(timeTakenMs / (1000 * 60));
        const seconds = Math.floor((timeTakenMs % (1000 * 60)) / 1000);
        timeTaken = `${minutes}m ${seconds}s`;
      }
    } catch (e) {
      console.error("Error calculating time taken:", e);
    }
  }

  // Calculate wrong answers if not provided
  const wrongAnswers = result.wrong_answers !== undefined 
    ? result.wrong_answers 
    : result.total_questions - result.correct_answers;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Quiz Results</h1>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Score</span>
              <span className="text-2xl font-bold text-blue-600">{result.score}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <FaCheckCircle className="text-green-500 text-xl mr-3" />
                <div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                  <div className="text-lg font-semibold text-green-700">{result.correct_answers}</div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <FaTimesCircle className="text-red-500 text-xl mr-3" />
                <div>
                  <div className="text-sm text-gray-600">Wrong Answers</div>
                  <div className="text-lg font-semibold text-red-700">{wrongAnswers}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Time Taken</span>
              <span className="text-lg font-semibold text-gray-800">{timeTaken}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Questions</span>
              <span className="text-lg font-semibold text-gray-800">{result.total_questions}</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult; 