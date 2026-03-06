import api from './api';

export const getConfigs = () => {
  return api.get('/config/get');
};