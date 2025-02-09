const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `http://${window.location.hostname}:8000/api/v1`  // Production (EC2)
  : 'http://localhost:8000/api/v1';                   // Development

// Add withCredentials to fetch options
export const fetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

export { API_BASE_URL }; 