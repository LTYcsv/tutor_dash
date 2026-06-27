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

describe('GET /api/finance', () => {
  it('returns finance shape', async () => {
    const res = await request(app).get('/api/finance?month=2026-06').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('payments');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byMethod');
    expect(res.body).toHaveProperty('pending');
  });

  it('filters payments by month (dueDate)', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-06-15', status: 'PAID' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 2000, method: 'CASH', dueDate: '2026-07-01', status: 'PAID' });
    const res = await request(app).get('/api/finance?month=2026-06').set(auth());
    expect(res.body.payments).toHaveLength(1);
    expect(Number(res.body.total)).toBe(3000);
  });

  it('sums byMethod correctly', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-06-10', status: 'PAID' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 1500, method: 'CASH', dueDate: '2026-06-20', status: 'PAID' });
    const res = await request(app).get('/api/finance?month=2026-06').set(auth());
    expect(Number(res.body.byMethod.CARD)).toBe(3000);
    expect(Number(res.body.byMethod.CASH)).toBe(1500);
  });

  it('counts pending separately (not in total)', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-06-10', status: 'PAID' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 500, method: 'CASH', dueDate: '2026-06-25', status: 'PENDING' });
    const res = await request(app).get('/api/finance?month=2026-06').set(auth());
    expect(Number(res.body.total)).toBe(3000);
    expect(Number(res.body.pending)).toBe(500);
  });

  it('defaults to current month when no month param', async () => {
    const res = await request(app).get('/api/finance').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('payments');
  });
});
