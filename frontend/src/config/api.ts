// Base API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'https://selftesthub.com';

// Ensure HTTPS without modifying the URL structure
const getSecureUrl = (url: string) => {
  const secureUrl = url.replace('http://', 'https://');
  // Remove trailing slash if it exists
  return secureUrl.endsWith('/') ? secureUrl.slice(0, -1) : secureUrl;
};

// Common fetch options
export const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  mode: 'cors' as RequestMode
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: getSecureUrl(`${API_URL}/api/v1/auth/login`),
  REGISTER: getSecureUrl(`${API_URL}/api/v1/auth/register`),
  LOGOUT: getSecureUrl(`${API_URL}/api/v1/auth/logout`),
  ME: getSecureUrl(`${API_URL}/api/v1/auth/me`),

  // Quiz endpoints
  QUIZZES: getSecureUrl(`${API_URL}/api/v1/quizzes`),
  QUIZ: (id: string) => getSecureUrl(`${API_URL}/api/v1/quizzes/${id}`),
  CREATE_QUIZ: getSecureUrl(`${API_URL}/api/v1/quizzes`),
  UPDATE_QUIZ: (id: string) => getSecureUrl(`${API_URL}/api/v1/quizzes/${id}`),
  DELETE_QUIZ: (id: string) => getSecureUrl(`${API_URL}/api/v1/quizzes/${id}`),
  START_QUIZ: (id: string) => getSecureUrl(`${API_URL}/api/v1/quizzes/${id}/start`),
  SUBMIT_QUIZ: (quizId: string, attemptId: string) => 
    getSecureUrl(`${API_URL}/api/v1/quizzes/${quizId}/submit?attempt_id=${attemptId}`),

  // Results endpoints
  RESULTS: getSecureUrl(`${API_URL}/api/v1/results`),
  USER_RESULTS: getSecureUrl(`${API_URL}/api/v1/results/user`),
  QUIZ_RESULTS: (quizId: string) => getSecureUrl(`${API_URL}/api/v1/results/quiz/${quizId}`),

  // User endpoints
  USERS: getSecureUrl(`${API_URL}/api/v1/users`),
  USER: (id: string) => getSecureUrl(`${API_URL}/api/v1/users/${id}`),
  UPDATE_USER: (id: string) => getSecureUrl(`${API_URL}/api/v1/users/${id}`),
  DELETE_USER: (id: string) => getSecureUrl(`${API_URL}/api/v1/users/${id}`),

  // Admin endpoints
  ADMIN_REPORTS: getSecureUrl(`${API_URL}/api/v1/admin/reports`),
  STUDENT_REPORTS: getSecureUrl(`${API_URL}/api/v1/admin/student-reports`),
  QUIZ_REPORTS: getSecureUrl(`${API_URL}/api/v1/admin/quiz-attempts`),

  // Profile endpoints
  UPDATE_PROFILE: getSecureUrl(`${API_URL}/api/v1/profile`),
  CHANGE_PASSWORD: getSecureUrl(`${API_URL}/api/v1/profile/password`),
};

export default API_ENDPOINTS; 