// Replace any hardcoded URLs with environment variable
const API_URL = import.meta.env.VITE_API_URL || 'https://selftesthub.com/api';

export const API_ENDPOINTS = {
    // Remove any port numbers from these URLs
    LOGIN: `${API_URL}/v1/auth/login`,
    // ... other endpoints
};

export default API_ENDPOINTS; 