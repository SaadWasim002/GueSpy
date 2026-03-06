import api from './api';

export const getScreen = () => {
  return api.get('/game-engine/get-screen');
};

export const resetGame = () => {
  return api.post('/game-engine/reset');
};

export const setGameOptions = (options) => {
  return api.post('/game-engine/game-option', options);
};

export const revealRole = () => {
  return api.get('/game-engine/role-reveal');
};