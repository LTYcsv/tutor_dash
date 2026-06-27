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

describe('GET /api/students', () => {
  it('returns empty array when no students', async () => {
    const res = await request(app).get('/api/students').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns list after creating a student', async () => {
    await request(app).post('/api/students').set(auth())
      .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
    const res = await request(app).get('/api/students').set(auth());
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Максим Котов');
  });
});

describe('POST /api/students', () => {
  it('creates student with auto-generated initials', async () => {
    const res = await request(app).post('/api/students').set(auth())
      .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
    expect(res.status).toBe(201);
    expect(res.body.initials).toBe('МК');
    expect(res.body.subjects).toHaveLength(1);
    expect(res.body.subjects[0].subject).toBe('Математика');
  });

  it('uses provided initials over auto-generated', async () => {
    const res = await request(app).post('/api/students').set(auth())
      .send({ name: 'Максим Иванович Котов', initials: 'МК', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
    expect(res.body.initials).toBe('МК');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/students').set(auth())
      .send({ name: 'Тест' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/students/:id', () => {
  it('updates student phone', async () => {
    const create = await request(app).post('/api/students').set(auth())
      .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
    const res = await request(app)
      .patch(`/api/students/${create.body.id}`)
      .set(auth())
      .send({ phone: '+7 999 999' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+7 999 999');
  });
});

describe('DELETE /api/students/:id', () => {
  it('deletes student and returns 204', async () => {
    const create = await request(app).post('/api/students').set(auth())
      .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
    const del = await request(app).delete(`/api/students/${create.body.id}`).set(auth());
    expect(del.status).toBe(204);
    const list = await request(app).get('/api/students').set(auth());
    expect(list.body).toHaveLength(0);
  });
});
