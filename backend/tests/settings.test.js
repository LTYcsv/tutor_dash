const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken } = require('./helpers/db');

let token;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/settings', () => {
  it('returns tutor profile without passwordHash', async () => {
    const res = await request(app).get('/api/settings').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('tutor@test.com');
    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe('PATCH /api/settings', () => {
  it('updates tutor name and timezone', async () => {
    const res = await request(app).patch('/api/settings').set(auth())
      .send({ name: 'Обновлённое Имя', timezone: 'Europe/London' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Обновлённое Имя');
    expect(res.body.timezone).toBe('Europe/London');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('updates ratePerHour', async () => {
    const res = await request(app).patch('/api/settings').set(auth())
      .send({ ratePerHour: 2000 });
    expect(Number(res.body.ratePerHour)).toBe(2000);
  });
});

describe('PATCH /api/settings/password', () => {
  it('changes password and allows login with new password', async () => {
    const change = await request(app).patch('/api/settings/password').set(auth())
      .send({ currentPassword: 'password123', newPassword: 'newpass456' });
    expect(change.status).toBe(200);

    const login = await request(app).post('/api/auth/login')
      .send({ email: 'tutor@test.com', password: 'newpass456' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });

  it('returns 401 for wrong currentPassword', async () => {
    const res = await request(app).patch('/api/settings/password').set(auth())
      .send({ currentPassword: 'wrong', newPassword: 'newpass456' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields missing', async () => {
    const res = await request(app).patch('/api/settings/password').set(auth())
      .send({ currentPassword: 'password123' });
    expect(res.status).toBe(400);
  });
});
