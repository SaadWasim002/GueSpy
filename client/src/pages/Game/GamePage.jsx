import React, { useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategorySelectionScreen from './CategorySelectionScreen';
import InitialGameScreen from './InitialGameScreen';
import GameOptionSelectionScreen from './GameOptionSelectionScreen';
import WordSpyRevealScreen from './WordSpyRevealScreen';
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

  // Correcting the flow to ensure NOT_STARTED shows the InitialGameScreen.
  if (gameStatus === 'CATEGORY_SELECTION' || gameStatus === 'NOT_STARTED') {
    return <CategorySelectionScreen />;
  }

  if (gameStatus === 'GROUP_SELECTION') {
    return <GroupSelectionScreen />;
  }

  if (gameStatus === 'GAME_OPTION_SELECTION') {
    return <GameOptionSelectionScreen />;
  }

  if (gameStatus === 'WORD_AND_SPY_REVEAL') {
    return <WordSpyRevealScreen />;
  }

  // For any other existing game state, show the initial screen to continue or reset.
  // This now correctly handles 'NOT_STARTED' as well.
  if (gameStatus) {
    return <InitialGameScreen />;
  }

  // Fallback for when there's no status
  return null;
};

export default GamePage;