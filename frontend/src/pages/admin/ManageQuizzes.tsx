import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_ENDPOINTS,fetchOptions } from '../../config/api';
import CreateQuizModal from '../../components/Admin/CreateQuizModal';
import EditQuizModal from '../../components/Admin/EditQuizModal';
import { Quiz } from '../../types/quiz';
console.log('Fetching quizzes from:here in the page');
const ManageQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const fetchQuizzes = async () => {
    try {
      console.log('Fetching quizzes from here in the fetchquizzes',API_ENDPOINTS.QUIZZES);
      const response = await fetch(API_ENDPOINTS.QUIZZES, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  console.log('Fetching quizzes from here in the fetchquizzes 1');
  useEffect(() => {
    console.log('Fetching quizzes from here in the fetchquizzes');
    fetchQuizzes();
  }, []);

  const handleQuizCreated = () => {
    setIsCreateModalOpen(false);
    fetchQuizzes(); // Refresh the quiz list
  };

  const handleToggleActive = async (quizId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_QUIZ(quizId.toString()), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        await fetchQuizzes(); // Refresh quiz list
      }
    } catch (err) {
      setError('Failed to update quiz status');
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_QUIZ(quizId.toString()), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchQuizzes(); // Refresh quiz list
      }
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Quizzes</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Quiz
        </button>
      </div>

      {isCreateModalOpen && (
        <CreateQuizModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onQuizCreated={handleQuizCreated}
        />
      )}

      {editingQuiz && (
        <EditQuizModal
          quiz={editingQuiz}
          isOpen={!!editingQuiz}
          onClose={() => setEditingQuiz(null)}
          onUpdate={() => {
            setEditingQuiz(null);
            fetchQuizzes();
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="border-b">
                <td className="px-6 py-4 whitespace-nowrap">{quiz.title}</td>
                <td className="px-6 py-4 whitespace-nowrap uppercase">{quiz.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{quiz.questions.length}</td>
                <td className="px-6 py-4 whitespace-nowrap">{quiz.duration} min</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(quiz.id, quiz.is_active)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quiz.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {quiz.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    className="text-blue-600 hover:text-blue-800 mr-3"
                    onClick={() => handleEditQuiz(quiz)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageQuizzes; 