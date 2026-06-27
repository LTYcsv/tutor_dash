const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

let token, studentId, subjectId;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
  const s = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Максим Котов', phone: '+7', subject: 'Математика', level: 'B2' });
  studentId = s.body.id;
  subjectId = s.body.subjects[0].id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/dashboard', () => {
  it('returns dashboard shape', async () => {
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todaySessions');
    expect(res.body).toHaveProperty('weekSessions');
    expect(res.body).toHaveProperty('recentActivity');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('studentsCount');
    expect(res.body.stats).toHaveProperty('monthEarnings');
    expect(res.body.stats).toHaveProperty('pendingPayments');
  });

  it('stats.studentsCount reflects actual count', async () => {
    await request(app).post('/api/students').set(auth())
      .send({ name: 'Второй', phone: '+7 2', subject: 'Физика', level: 'A2' });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.body.stats.studentsCount).toBe(2);
  });

  it('todaySessions contains sessions starting today', async () => {
    const now = new Date();
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: now.toISOString(), durationMin: 60 });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.body.todaySessions).toHaveLength(1);
  });

  it('recentActivity is array (possibly empty)', async () => {
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it('stats.pendingPayments counts PENDING payments', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01', status: 'PENDING' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 1500, method: 'CASH', dueDate: '2026-07-01', status: 'PAID' });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.body.stats.pendingPayments).toBe(1);
  });

  it('stats.monthEarnings sums PAID payments this month', async () => {
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 3000, method: 'CARD', dueDate: '2026-07-01', status: 'PAID' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 1500, method: 'CASH', dueDate: '2026-07-01', status: 'PAID' });
    await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 500, method: 'CASH', dueDate: '2026-07-01', status: 'PENDING' });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(Number(res.body.stats.monthEarnings)).toBe(4500);
  });
});
