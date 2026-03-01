import api from './api';

export const getScreen = () => {
  return api.get('/game-engine/get-screen');
};

export const resetGame = () => {
  return api.post('/game-engine/reset');
};