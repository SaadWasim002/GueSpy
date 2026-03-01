import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    userId: null,
    role: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Add expiration check if needed
        setAuth({
          token,
          userId: decoded.userId, // As per PRD
          role: decoded.role,     // As per PRD
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setAuth({
      token,
      userId: decoded.userId,
      role: decoded.role,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth({ token: null, userId: null, role: null, isAuthenticated: false });
  };

  const value = { ...auth, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
