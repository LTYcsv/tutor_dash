const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor } = require('./helpers/db');

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
});

describe('POST /api/auth/login', () => {
  it('returns JWT and tutor (no passwordHash) for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tutor@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.tutor.email).toBe('tutor@test.com');
    expect(res.body.tutor).not.toHaveProperty('passwordHash');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tutor@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tutor@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('Protected routes require JWT', () => {
  it('returns 401 on GET /api/students without token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});
