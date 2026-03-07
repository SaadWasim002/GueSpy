import React, { useState, useEffect, useRef } from 'react';
import { revealRole } from '../../services/gameService';
import { useGame } from '../../hooks/useGame';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './WordSpyRevealScreen.css';

const WordSpyRevealScreen = () => {
  // `screenData` from useGame is the initial state for this screen.
  const { fetchScreen } = useGame();

  const [currentScreen, setCurrentScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialFetchMade = useRef(false);

  // This effect runs once on mount to get the first screen of the reveal flow.
  useEffect(() => {
    // In React's StrictMode, this effect can run twice in development.
    // This ref guard ensures the API is only called once.
    if (initialFetchMade.current) {
      return;
    }
    initialFetchMade.current = true;

    const fetchInitialRevealScreen = async () => {
      setLoading(true);
      setError('');
      try {
        // As per your request, call revealRole() immediately
        // to get the first screen in the sequence.
        const response = await revealRole();
        setCurrentScreen(response.data.data);
      } catch (err) {
        setError('An error occurred starting the role reveal. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialRevealScreen();
  }, []); // Empty dependency array ensures this runs only once on mount.

  const handleContinue = async () => {
    // If the last player has seen their role, fetch the next main game screen
    if (currentScreen && currentScreen.isLast) {
      setLoading(true);
      await fetchScreen();
      // The component will unmount as GamePage switches to the next screen
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await revealRole();
      setCurrentScreen(response.data.data);
    } catch (err) {
      setError('An error occurred during the role reveal. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message" style={{ textAlign: 'center', marginTop: '5rem' }}>{error}</div>;
  }

  if (!currentScreen) {
    // This case handles if the initial fetch fails without an error message,
    // or if the API returns empty data.
    return <div className="error-message" style={{ textAlign: 'center', marginTop: '5rem' }}>Could not load the reveal screen.</div>;
  }

  const { screenType, displayText, playerDetails, categoryName, wordName } = currentScreen;
  const isSpy = playerDetails?.isSpy;

  return (
    <div className="reveal-container">

      {screenType === 'PASS_DEVICE' && (
        <div className="reveal-card pass-device">
          <div className="player-avatar"></div>
          <h1>{displayText}</h1>
        </div>
      )}

      {screenType === 'ROLE_REVEAL' && (
        <div className="reveal-card role-reveal">
          <p className="player-name-reveal">It's your turn, {playerDetails.playerName}</p>
          <h1>{displayText}</h1>

          <div className="details-box">
            <p><strong>Category:</strong> {categoryName}</p>
            {isSpy === false && <p><strong>Your Word:</strong> {wordName}</p>}
          </div>
        </div>
      )}

      <div className="continue-button-container">
        <Button onClick={handleContinue} disabled={loading}>
          {loading ? 'Loading...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default WordSpyRevealScreen;