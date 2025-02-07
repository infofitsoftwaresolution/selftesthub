import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import CreateQuizModal from '../../components/Admin/CreateQuizModal';

interface Quiz {
  id: number;
  title: string;
  type: 'mcq' | 'test';
  questions: any[];
  duration: number;
  is_active: boolean;
}

const ManageQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch quizzes on component mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/quizzes/', {
        headers: {
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
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (quizData: any) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/quizzes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        await fetchQuizzes(); // Refresh quiz list
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create quiz');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (quizId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/quizzes/${quizId}`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/quizzes/${quizId}`, {
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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Quizzes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Create Quiz
        </button>
      </div>

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
                    onClick={() => {/* TODO: Implement edit */}}
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

      <CreateQuizModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateQuiz}
      />
    </div>
  );
};

export default ManageQuizzes; 