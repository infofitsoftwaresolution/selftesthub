import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    navigate('/available-quizzes');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Quiz Results</h1>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {result.score}%
              </div>
              <div className="text-gray-600">Score</div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {Object.keys(result.answers).length}
              </div>
              <div className="text-gray-600">Questions Answered</div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {result.timeTaken}
              </div>
              <div className="text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/available-quizzes')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult; 