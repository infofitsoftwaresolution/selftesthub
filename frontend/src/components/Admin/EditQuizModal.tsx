import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { Quiz, Question } from '../../types/quiz';
import { quizApi } from '../../services/api';

interface EditQuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onUpdate: () => void;
}

const EditQuizModal: React.FC<EditQuizModalProps> = ({ quiz, onClose, onUpdate }) => {
  const [quizData, setQuizData] = useState<Quiz>(quiz);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  useEffect(() => {
    setQuizData(quiz);
  }, [quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await quizApi.updateQuiz(quiz.id, quizData);
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to update quiz. Please try again.');
    }
  };

  const handlePublish = async () => {
    try {
      await quizApi.updateQuiz(quiz.id, { ...quizData, is_draft: false });
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to publish quiz. Please try again.');
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: -Date.now(), // Temporary negative ID for new questions
      quiz_id: quiz.id,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setIsAddingQuestion(true);
    setCurrentQuestion(newQuestion);
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
  };

  const handleDeleteQuestion = (questionId: number) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter(q => q.id !== questionId)
    });
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion) return;

    let updatedQuestions;
    if (isAddingQuestion || currentQuestion.id < 0) {
      // This is a new question
      const newQuestion = {
        ...currentQuestion,
        id: Math.max(...quizData.questions.map(q => q.id), 0) + 1 // Generate a new unique ID
      };
      updatedQuestions = [...quizData.questions, newQuestion];
    } else {
      // This is an existing question being edited
      updatedQuestions = quizData.questions.map(q => 
        q.id === currentQuestion.id ? currentQuestion : q
      );
    }

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
    setIsAddingQuestion(false);
    setCurrentQuestion(null);
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setQuizData(prev => {
      if (toIndex < 0 || toIndex >= prev.questions.length) return prev;
      const updated = [...prev.questions];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, questions: updated };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Quiz</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
            <select
              value={quizData.type}
              onChange={(e) => setQuizData({ ...quizData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="practice">Practice</option>
              <option value="exam">Exam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={quizData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setQuizData({ ...quizData, is_active: e.target.value === 'active' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Questions</h3>
            <div className="space-y-4">
              {quizData.questions.map((question, index) => (
                <div key={question.id} className="border p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium whitespace-pre-wrap">
                      Q{index + 1}. {question.text}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, index - 1)}
                        disabled={index === 0}
                        className={`px-2 py-1 border rounded text-xs ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, index + 1)}
                        disabled={index === quizData.questions.length - 1}
                        className={`px-2 py-1 border rounded text-xs ${index === quizData.questions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditQuestion(question)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          question.correctAnswer === index
                            ? 'bg-green-100 border border-green-500'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{option}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Question
            </button>
          </div>

          {currentQuestion && (
            <div className="border p-4 rounded-md">
              <h4 className="text-lg font-medium mb-4">Edit Question</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <textarea
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                    placeholder="Enter question (supports multiple lines)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {index + 1}
                      </label>
                      <div className="flex">
                        <textarea
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px]"
                          placeholder={`Option ${index + 1} (supports multiple lines)`}
                          rows={2}
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

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => { setCurrentQuestion(null); setIsAddingQuestion(false); }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuestion}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex justify-end space-x-2">
            {quizData.is_draft && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Publish Quiz
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuizModal; 