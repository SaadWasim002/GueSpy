import React, { createContext, useState, useCallback, useContext } from 'react';
import { getScreen } from '../services/gameService';
import { useAuth } from '../hooks/useAuth';

export const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    gameStatus: null,
    screenData: null,
    loading: true,
    error: null,
  });
  const { isAuthenticated } = useAuth();

  const fetchScreen = useCallback(async () => {
    if (!isAuthenticated) {
      setGameState(s => ({ ...s, loading: false }));
      return;
    }
    setGameState(s => ({ ...s, loading: true, error: null }));
    try {
      const response = await getScreen();
      setGameState({
        gameStatus: response.data.gameStatus,
        screenData: response.data.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch game screen:", error);
      setGameState({
        gameStatus: null,
        screenData: null,
        loading: false,
        error: "Failed to load game state. Please try again.",
      });
    }
  }, [isAuthenticated]);

  const value = { ...gameState, fetchScreen };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
