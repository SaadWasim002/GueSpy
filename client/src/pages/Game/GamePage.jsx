import React, { useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategorySelectionScreen from './CategorySelectionScreen';
import InitialGameScreen from './InitialGameScreen';
import GameOptionSelectionScreen from './GameOptionSelectionScreen';
import WordSpyRevealScreen from './WordSpyRevealScreen';
import GroupSelectionScreen from './GroupSelectionScreen';
import DiscussionTimeScreen from './DiscussionTimeScreen';
import VotingScreen from './VotingScreen';

const GamePage = () => {
  const { gameStatus, loading, error, fetchScreen, hasInteracted } = useGame();
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

  // Always show the initial screen first until the user clicks "Continue" or "New Game".
  if (!hasInteracted) {
    return <InitialGameScreen />;
  }

  // After interaction, route to the correct game screen based on the status.
  switch (gameStatus) {
    case 'NOT_STARTED':
      return <CategorySelectionScreen />;
    case 'CATEGORY_SELECTION':
      return <CategorySelectionScreen />;
    case 'GROUP_SELECTION':
      return <GroupSelectionScreen />;
    case 'GAME_OPTION_SELECTION':
      return <GameOptionSelectionScreen />;
    case 'WORD_AND_SPY_REVEAL':
      return <WordSpyRevealScreen />;
    case 'DISCUSSION_TIME':
      return <DiscussionTimeScreen />;
    case 'VOTING':
      return <VotingScreen />;
    // The "Continue" button there will be disabled if there's no game to continue.
    default:
      return <InitialGameScreen />;
  }
};

export default GamePage;