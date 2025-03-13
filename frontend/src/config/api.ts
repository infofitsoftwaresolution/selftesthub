// Base API URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Common fetch options
export const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
  ME: `${API_BASE_URL}/api/v1/auth/me`,

  // Quiz endpoints
  QUIZZES: `${API_BASE_URL}/api/v1/quizzes`,
  QUIZ: (id: string) => `${API_BASE_URL}/api/v1/quizzes/${id}`,
  CREATE_QUIZ: `${API_BASE_URL}/api/v1/quizzes`,
  UPDATE_QUIZ: (id: string) => `${API_BASE_URL}/api/v1/quizzes/${id}`,
  DELETE_QUIZ: (id: string) => `${API_BASE_URL}/api/v1/quizzes/${id}`,
  START_QUIZ: (id: string) => `${API_BASE_URL}/api/v1/quizzes/${id}/start`,
  SUBMIT_QUIZ: (quizId: string, attemptId: string) => `${API_BASE_URL}/api/v1/quizzes/${quizId}/submit?attempt_id=${attemptId}`,

  // Results endpoints
  RESULTS: `${API_BASE_URL}/api/v1/results`,
  USER_RESULTS: `${API_BASE_URL}/api/v1/results/user`,
  QUIZ_RESULTS: (quizId: string) => `${API_BASE_URL}/api/v1/results/quiz/${quizId}`,

  // User endpoints
  USERS: `${API_BASE_URL}/api/v1/users`,
  USER: (id: string) => `${API_BASE_URL}/api/v1/users/${id}`,
  UPDATE_USER: (id: string) => `${API_BASE_URL}/api/v1/users/${id}`,
  DELETE_USER: (id: string) => `${API_BASE_URL}/api/v1/users/${id}`,

  // Admin endpoints
  ADMIN_REPORTS: `${API_BASE_URL}/api/v1/admin/reports`,
  STUDENT_REPORTS: `${API_BASE_URL}/api/v1/admin/student-reports`,
  QUIZ_REPORTS: `${API_BASE_URL}/api/v1/admin/quiz-reports`,

  // Profile endpoints
  UPDATE_PROFILE: `${API_BASE_URL}/api/v1/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/v1/profile/password`,
};

export default API_ENDPOINTS; 