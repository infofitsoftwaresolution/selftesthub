import React, { useState } from 'react';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import { Quiz, QuizUpdate, Question } from '../../types/quiz';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';

interface EditQuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditQuizModal: React.FC<EditQuizModalProps> = ({ quiz, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<QuizUpdate>({
    title: quiz.title,
    duration: quiz.duration,
    type: quiz.type,
    is_active: quiz.is_active,
    is_draft: quiz.is_draft
  });
  
  const [questions, setQuestions] = useState<Question[]>(quiz.questions);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: 0,
    quiz_id: quiz.id,
    text: '',
    options: ['', '', '', '']
  });
  
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
      setError('Please fill in all question fields');
      return;
    }
    
    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = { ...currentQuestion };
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      // Add new question
      setQuestions([...questions, { ...currentQuestion, id: questions.length + 1 }]);
    }
    
    // Reset current question
    setCurrentQuestion({
      id: 0,
      quiz_id: quiz.id,
      text: '',
      options: ['', '', '', '']
    });
    setError('');
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingQuestionIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.UPDATE_QUIZ(quiz.id.toString()), {
        method: 'PATCH',
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          questions: questions
        })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      setError('Failed to update quiz');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.UPDATE_QUIZ(quiz.id.toString()), {
        method: 'PATCH',
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_draft: false
        })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to publish quiz');
      }
    } catch (error) {
      console.error('Error publishing quiz:', error);
      setError('Failed to publish quiz');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Quiz</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <FaTimes />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="practice">Practice</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Questions Section */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Questions</h4>
              
              {/* Add/Edit Question Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                </h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question Text</label>
                    <input
                      type="text"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter question"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700">
                          Option {index + 1}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    {editingQuestionIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionIndex(null);
                          setCurrentQuestion({
                            id: 0,
                            quiz_id: quiz.id,
                            text: '',
                            options: ['', '', '', '']
                          });
                        }}
                        className="mr-2 px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Questions List */}
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {questions.map((question, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Q{index + 1}:</span>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1">{question.text}</p>
                    <div className="mt-2 space-y-1 ml-4">
                      {question.options.map((option, optIndex) => (
                        <p key={optIndex}>
                          {optIndex + 1}. {option}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              
              {quiz.is_draft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Quiz'}
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditQuizModal; 