import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import GamePage from './pages/Game/GamePage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/game" /> : <Navigate to="/login" />} />
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/game" />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/game" />} />
      <Route 
        path="/game" 
        element={isAuthenticated ? <GamePage /> : <Navigate to="/login" />} 
      />
      {/* Add other game routes here as they are built */}
    </Routes>
  );
}

export default App;