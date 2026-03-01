import React, { useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategorySelectionScreen from './CategorySelectionScreen';
import InitialGameScreen from './InitialGameScreen';
import GroupSelectionScreen from './GroupSelectionScreen';

const GamePage = () => {
  const { gameStatus, loading, error, fetchScreen } = useGame();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchScreen();
    }
  }, [isAuthenticated, fetchScreen]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div style={{ color: 'var(--error-color)', textAlign: 'center', marginTop: '5rem' }}>{error}</div>;
  }

  if (gameStatus === 'CATEGORY_SELECTION' || gameStatus === 'NOT_STARTED') {
    return <CategorySelectionScreen />;
  }

  if (gameStatus === 'GROUP_SELECTION') {
    return <GroupSelectionScreen />;
  }

  // For any other existing game state, show the initial screen to continue or reset.
  if (gameStatus) {
    return <InitialGameScreen />;
  }

  // Fallback for when there's no status
  return null;
};

export default GamePage;