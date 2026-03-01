import api from './api';

export const registerUser = (userData) => {
  // The PRD says the request is { username, email, password }, not nested.
  return api.post('/auth/register', userData);
};

export const loginUser = (credentials) => {
  // The PRD says the request is { email, password }, not nested.
  return api.post('/auth/login', credentials);
};