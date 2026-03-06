import api from './api';

export const getCategories = () => {
  return api.get('/category/get');
};

export const selectCategory = (categoryId) => {
  return api.post('/category/select', { id: categoryId });
};