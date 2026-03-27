// Base API URL from environment variable - strip trailing /api/v1 if present to avoid duplication
const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://selftesthub.com';
const API_URL = RAW_API_URL.replace(/\/api\/v1\/?$/, '');
const isDevelopment = import.meta.env.DEV;
const getSecureUrl = (url: string) => isDevelopment ? url : url.replace('http://', 'https://');

// Function to ensure HTTPS in production
export const getSecureUrl1 = (url: string) => {
  if (isDevelopment) return url;
  return url.replace('http://', 'https://');
};

// Common fetch options
export const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};
console.log('API_URL:', API_URL);
console.log('Environment:', isDevelopment ? 'Development' : 'Production');
// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_URL}/api/v1/auth/login`,
  REGISTER: `${API_URL}/api/v1/auth/register`,
  LOGOUT: `${API_URL}/api/v1/auth/logout`,
  ME: `${API_URL}/api/v1/auth/me`,

  // Profile endpoints
  UPDATE_PROFILE: `${API_URL}/api/v1/profile/update`,
  CHANGE_PASSWORD: `${API_URL}/api/v1/profile/change-password`,

  // ... existing endpoints
  LEADERBOARD: `${API_URL}/api/v1/leaderboard`,

  // Quiz endpoints
  QUIZZES: `${API_URL}/api/v1/quizzes/`,
  ACTIVE_QUIZZES: `${API_URL}/api/v1/quizzes`,
  QUIZ: (id: string) => `${API_URL}/api/v1/quizzes/${id}`,
  CREATE_QUIZ: `${API_URL}/api/v1/quizzes/`,
  UPLOAD_FILE_QUIZ: `${API_URL}/api/v1/quizzes/upload-file`,
  UPDATE_QUIZ: (id: string) => `${API_URL}/api/v1/quizzes/${id}`,
  DELETE_QUIZ: (id: string) => `${API_URL}/api/v1/quizzes/${id}`,
  START_QUIZ: (id: string) => `${API_URL}/api/v1/quizzes/${id}/start`,
  SUBMIT_QUIZ: (quizId: string, attemptId: string) => 
    `${API_URL}/api/v1/quizzes/${quizId}/submit?attempt_id=${attemptId}`,

  // Results endpoints
  RESULTS: `${API_URL}/api/v1/results`,
  USER_RESULTS: `${API_URL}/api/v1/results/user`,
  QUIZ_RESULTS: (quizId: string) => `${API_URL}/api/v1/results/quiz/${quizId}`,

  // User endpoints
  USERS: `${API_URL}/api/v1/users`,
  USER: (id: string) => `${API_URL}/api/v1/users/${id}`,
  UPDATE_USER: (id: string) => `${API_URL}/api/v1/users/${id}`,
  DELETE_USER: (id: string) => `${API_URL}/api/v1/users/${id}`,

  // Admin endpoints
  ADMIN_REPORTS: `${API_URL}/api/v1/admin/reports`,
  DELETE_REPORT: (id: number) => `${API_URL}/api/v1/admin/reports/${id}`,
  UPDATE_REPORT_SCORE: (id: number) => `${API_URL}/api/v1/admin/reports/${id}/score`,
  STUDENT_REPORTS: `${API_URL}/api/v1/admin/student-reports`,
  QUIZ_REPORTS: `${API_URL}/api/v1/admin/quiz-attempts`,
  ADMIN_USERS: `${API_URL}/api/v1/admin/users`,
  UPDATE_USER_ROLE: (id: string) => `${API_URL}/api/v1/admin/users/${id}/role`,

  // Add these new endpoints
  REGISTER_SEND_OTP: getSecureUrl(`${API_URL}/api/v1/auth/register/send-otp`),
  REGISTER_VERIFY_OTP: getSecureUrl(`${API_URL}/api/v1/auth/register/verify-otp`),
  FORGOT_PASSWORD_SEND_OTP: getSecureUrl(`${API_URL}/api/v1/auth/forgot-password/send-otp`),
  FORGOT_PASSWORD_VERIFY_OTP: getSecureUrl(`${API_URL}/api/v1/auth/forgot-password/verify-otp`),
  QUIZ_ATTEMPTS: `${API_URL}/api/v1/quiz-attempts`,
  MY_ATTEMPTS: `${API_URL}/api/v1/quiz-attempts/my-attempts`,

  // Dashboard
  DASHBOARD_STATS: `${API_URL}/api/v1/dashboard/stats`,
};

export default API_ENDPOINTS; 