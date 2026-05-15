import axios from 'axios';

const API = axios.create({
  // This checks if you are on Vercel (production) or localhost (local)
  baseURL: process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api` 
    : 'http://localhost:8000/api',
});

// Auto attach token to requests
API.interceptors.request.use((req) => {
  // Look for 'access' key (matching AuthContext)
  const token = localStorage.getItem('access'); 
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Only set Content-Type to JSON if data is NOT FormData
  if (req.data && !(req.data instanceof FormData)) {
    req.headers['Content-Type'] = 'application/json';
  }

  return req;
});

// Handle response errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove correct keys
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;