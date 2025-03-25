import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose, onQuizCreated }) => {
  const [quizData, setQuizData] = useState({
    title: '',
    type: 'mcq',
    duration: 30,
    questions: [] as Question[],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

  const [error, setError] = useState('');

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
      setError('Please fill in all question fields');
      return;
    }
    
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: prev.questions.length + 1 }],
    }));
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (!quizData.title) {
        setError('Please enter a quiz title');
        return;
      }
      if (quizData.questions.length === 0) {
        setError('Please add at least one question');
        return;
      }

      const formattedQuestions = quizData.questions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer
      }));

      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.CREATE_QUIZ, {
        method: 'POST',
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: quizData.title,
          type: quizData.type,
          duration: quizData.duration,
          questions: formattedQuestions
        }),
        redirect: 'follow'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || `HTTP error! status: ${response.status}`);
      }

      await response.json();
      onQuizCreated();
      onClose();
      
      setQuizData({
        title: '',
        type: 'mcq',
        duration: 30,
        questions: [],
      });
      setError('');
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quiz. Please check your connection and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Quiz</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quiz Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={quizData.duration}
                onChange={(e) => setQuizData({ ...quizData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          {/* Add Question Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <input
                  type="text"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option {index + 1}
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                        className={`px-4 rounded-r-md ${
                          currentQuestion.correctAnswer === index
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Question
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div>
            <h3 className="text-lg font-medium mb-4">Questions Added ({quizData.questions.length})</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {quizData.questions.map((question, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">Q{index + 1}:</span>
                    <button
                      onClick={() => {
                        setQuizData(prev => ({
                          ...prev,
                          questions: prev.questions.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <p className="mt-1">{question.text}</p>
                  <div className="mt-2 space-y-1 ml-4">
                    {question.options.map((option, optIndex) => (
                      <p
                        key={optIndex}
                        className={optIndex === question.correctAnswer ? 'text-green-600 font-medium' : ''}
                      >
                        {optIndex + 1}. {option}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizModal; 