import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import { resetGame } from '../../services/gameService';
import Button from '../../components/common/Button';
import './InitialGameScreen.css';

const InitialGameScreen = () => {
  const { gameStatus, fetchScreen, setHasInteracted } = useGame();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNewGame = async () => {
    setLoading(true);
    setError('');
    try {
      await resetGame();
      // After resetting, fetch the new screen state, which should be CATEGORY_SELECTION
      await fetchScreen();
      setHasInteracted(); // Proceed to the new game screen
    } catch (err) {
      console.error("Failed to start a new game:", err);
      setError('Could not start a new game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Signal that the user has interacted, allowing GamePage to render the correct game screen.
    setHasInteracted();
  };

  const hasExistingGame = gameStatus !== 'NOT_STARTED';

  return (
    <div className="initial-game-container">
      <div className="logout-container">
        <button onClick={logout} className="logout-button">Logout</button>
      </div>
      <h1>Welcome to GueSpy</h1>
      {hasExistingGame ? (
        <p>Your current game is in the '{gameStatus}' phase.</p>
      ) : (
        <p>You don't have a game in progress. Start a new one!</p>
      )}
      {error && <p className="error-message">{error}</p>}
      <div className="button-group">
        <Button onClick={handleContinue} disabled={loading || !hasExistingGame}>Continue Game</Button>
        <Button onClick={handleNewGame} disabled={loading}>
          {loading ? 'Starting...' : 'New Game'}
        </Button>
      </div>
    </div>
  );
};

export default InitialGameScreen;