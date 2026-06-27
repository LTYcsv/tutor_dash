const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken } = require('./helpers/db');

let token, studentId;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
  const s = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ученик', phone: '+7', subject: 'Математика', level: 'B1' });
  studentId = s.body.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('POST /api/payments', () => {
  it('creates payment with PENDING status by default', async () => {
    const res = await request(app).post('/api/payments').set(auth()).send({
      studentId,
      amount: 3000,
      method: 'CARD',
      dueDate: '2026-07-01'
    });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe('3000');
    expect(res.body.status).toBe('PENDING');
    expect(res.body.method).toBe('CARD');
  });

  it('creates payment with explicit status', async () => {
    const res = await request(app).post('/api/payments').set(auth()).send({
      studentId,
      amount: 1500,
      method: 'CASH',
      status: 'PAID',
      dueDate: '2026-07-01'
    });
    expect(res.body.status).toBe('PAID');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/payments').set(auth()).send({ studentId });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/payments', () => {
  it('returns all payments', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 1500, method: 'CASH', dueDate: '2026-08-01' });
    const res = await request(app).get('/api/payments').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by studentId', async () => {
    const s2 = await request(app).post('/api/students').set(auth())
      .send({ name: 'Другой', phone: '+7 999', subject: 'Физика', level: 'A2' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId: s2.body.id, amount: 2000, method: 'CASH', dueDate: '2026-07-01' });
    const res = await request(app).get(`/api/payments?studentId=${studentId}`).set(auth());
    expect(res.body).toHaveLength(1);
    expect(res.body[0].studentId).toBe(studentId);
  });
});

describe('PATCH /api/payments/:id', () => {
  it('marks payment as PAID', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01' });
    const res = await request(app).patch(`/api/payments/${create.body.id}`).set(auth())
      .send({ status: 'PAID' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PAID');
  });

  it('updates method and amount', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01' });
    const res = await request(app).patch(`/api/payments/${create.body.id}`).set(auth())
      .send({ method: 'TRANSFER', amount: 3500 });
    expect(res.body.method).toBe('TRANSFER');
    expect(res.body.amount).toBe('3500');
  });
});

describe('DELETE /api/payments/:id', () => {
  it('deletes payment and returns 204', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01' });
    const res = await request(app).delete(`/api/payments/${create.body.id}`).set(auth());
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/payments').set(auth());
    expect(list.body).toHaveLength(0);
  });
});
