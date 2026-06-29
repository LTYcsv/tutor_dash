import client from './client';

export const getStudents = () => client.get('/api/students').then(r => r.data);
export const getStudent = id => client.get(`/api/students/${id}`).then(r => r.data);
export const createStudent = data => client.post('/api/students', data).then(r => r.data);
export const updateStudent = (id, data) => client.patch(`/api/students/${id}`, data).then(r => r.data);
export const deleteStudent = id => client.delete(`/api/students/${id}`);
export const getHomework = (status) => client.get('/api/homework', { params: status ? { status } : {} }).then(r => r.data);
export const createHomework = data => client.post('/api/homework', data).then(r => r.data);
export const updateHomework = (id, data) => client.patch(`/api/homework/${id}`, data).then(r => r.data);
export const toggleTopic = (id, completed) => client.patch(`/api/topics/${id}`, { completed }).then(r => r.data);
export const remindPayment = id => client.post(`/api/payments/${id}/remind`).then(r => r.data);
export const createNote = data => client.post('/api/notes', data).then(r => r.data);
export const updateNote = (id, data) => client.patch(`/api/notes/${id}`, data).then(r => r.data);
export const deleteNote = id => client.delete(`/api/notes/${id}`);
