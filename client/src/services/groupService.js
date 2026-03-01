import api from './api';

export const getGroups = () => {
  return api.get('/group/get');
};

export const getGroupById = (groupId) => {
  return api.get(`/group/get?groupId=${groupId}`);
};

export const createGroup = (groupData) => {
  return api.post('/group/create', groupData);
};

export const updateGroup = (groupId, groupData) => {
  return api.put(`/group/get?groupId=${groupId}`, groupData);
};

export const selectGroup = (groupId) => {
  return api.post('/group/select', { id: groupId });
};

export const deleteGroup = (groupId) => {
  return api.delete(`/group/delete?groupId=${groupId}`);
};