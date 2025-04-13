import { API_ENDPOINTS, fetchOptions } from '../config/api';
import { Quiz } from '../types/quiz';

export const quizApi = {
  updateQuiz: async (quizId: number, data: Partial<Quiz>): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(API_ENDPOINTS.UPDATE_QUIZ(quizId.toString()), {
      method: 'PATCH',
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update quiz');
    }
  }
}; 