import client from './client';

export const getFinance = () => client.get('/api/finance').then(r => r.data);
export const markPaid = (id, method) =>
  client.patch(`/api/payments/${id}`, { status: 'PAID', method }).then(r => r.data);
export const remindPayment = id =>
  client.post(`/api/payments/${id}/remind`).then(r => r.data);
