import client from './client';

export const getSessions = week =>
  client.get(`/api/sessions${week ? `?week=${week}` : ''}`).then(r => r.data);

export const createSession = data =>
  client.post('/api/sessions', data).then(r => r.data);

export const updateSession = (id, data) =>
  client.patch(`/api/sessions/${id}`, data).then(r => r.data);

export const deleteSession = id =>
  client.delete(`/api/sessions/${id}`);
