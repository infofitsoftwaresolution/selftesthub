import React from 'react';

interface QuestionNavigationProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  onQuestionSelect: (index: number) => void;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onQuestionSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Questions</h3>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            onClick={() => onQuestionSelect(i)}
            className={`p-2 rounded ${
              currentQuestion === i
                ? 'bg-blue-600 text-white'
                : answeredQuestions.includes(i)
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionNavigation; 