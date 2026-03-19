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
      // Parse timestamps and ensure they're in the correct format
      const startTime = new Date(result.started_at);
      const endTime = new Date(result.completed_at);
      
      // Check if timestamps are valid
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        // Calculate time difference in milliseconds
        let timeTakenMs = endTime.getTime() - startTime.getTime();
        
        // If time difference is negative, try to fix it
        if (timeTakenMs < 0) {
          // Try to extract just the time part and compare
          const startTimeStr = startTime.toTimeString().split(' ')[0];
          const endTimeStr = endTime.toTimeString().split(' ')[0];
          
          // If the dates are the same day but times are reversed, swap them
          if (startTime.toDateString() === endTime.toDateString() && 
              startTimeStr > endTimeStr) {
            timeTakenMs = startTime.getTime() - endTime.getTime();
          } else {
            // If we can't determine the correct order, use a fallback
            timeTakenMs = Math.abs(timeTakenMs);
          }
        }
        
        const minutes = Math.floor(timeTakenMs / (1000 * 60));
        const seconds = Math.floor((timeTakenMs % (1000 * 60)) / 1000);
        
        timeTaken = `${minutes}m ${seconds}s`;
      } else {
        console.log("Invalid timestamps detected");
      }
    } catch (e) {
      console.error("Error calculating time taken:", e);
    }
  } else {
    console.log("Missing timestamps:", { 
      started_at: result.started_at, 
      completed_at: result.completed_at 
    });
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