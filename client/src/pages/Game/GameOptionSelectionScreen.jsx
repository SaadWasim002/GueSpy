import React, { useState, useEffect } from 'react';
import { getConfigs } from '../../services/configService';
import { setGameOptions } from '../../services/gameService';
import { useGame } from '../../hooks/useGame';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './GameOptionSelectionScreen.css';

const GameOptionSelectionScreen = () => {
  const [numberOfSpies, setNumberOfSpies] = useState(1);
  const [spyConfig, setSpyConfig] = useState({ min: 1, max: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { fetchScreen } = useGame();

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const response = await getConfigs();
        const configs = response.data.data.configs || [];
        const min = configs.find(c => c.key === 'min_spy_allowed')?.value || 1;
        const max = configs.find(c => c.key === 'max_spy_allowed')?.value || 1;
        const minSpies = parseInt(min, 10);
        const maxSpies = parseInt(max, 10);
        
        setSpyConfig({ min: minSpies, max: maxSpies });
        setNumberOfSpies(minSpies); // Start with the minimum allowed
        setError('');
      } catch (err) {
        setError('Failed to load game options.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadConfigs();
  }, []);

  const handleSpyChange = (amount) => {
    const newCount = numberOfSpies + amount;
    if (newCount >= spyConfig.min && newCount <= spyConfig.max) {
      setNumberOfSpies(newCount);
      setError('');
    } else {
      setError(`Number of spies must be between ${spyConfig.min} and ${spyConfig.max}.`);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await setGameOptions({ number_of_spy: numberOfSpies });
      await fetchScreen(); // Fetch the next game state
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        setError(err.response?.data?.message || 'Invalid number of spies.');
      } else {
        setError('An error occurred while starting the game.');
      }
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="game-options-container">
      <h2>Configure Game Options</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="option-card">
        <h3>Number of Spies</h3>
        <div className="option-control">
          <button className="control-btn" onClick={() => handleSpyChange(-1)} disabled={numberOfSpies <= spyConfig.min}>-</button>
          <span className="option-value">{numberOfSpies}</span>
          <button className="control-btn" onClick={() => handleSpyChange(1)} disabled={numberOfSpies >= spyConfig.max}>+</button>
        </div>
      </div>

      <div className="start-game-button-container">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Starting...' : 'Start Game'}
        </Button>
      </div>
    </div>
  );
};

export default GameOptionSelectionScreen;