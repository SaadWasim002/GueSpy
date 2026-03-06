import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(config => {
  // A list of endpoints that do not require authentication.
  const noAuthEndpoints = ['/auth/register', '/auth/login'];

  // If the request URL is in our list of non-authenticated endpoints,
  // we return the config as-is without adding the Authorization header.
  if (noAuthEndpoints.includes(config.url)) {
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for handling global auth errors
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is a 401 Unauthorized or 403 Forbidden
    if (error.response && [401, 403].includes(error.response.status)) {
      // This indicates that the user's token is invalid, expired, or doesn't have
      // the necessary permissions. The safest action is to log the user out.
      console.error("Authentication error. Logging out.");

      // Remove the token from storage
      localStorage.removeItem('token');

      // Redirect to the login page. This will cause a full page refresh,
      // clearing all application state and forcing re-authentication.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;