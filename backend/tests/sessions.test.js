const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken } = require('./helpers/db');

let token, subjectId;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
  const s = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
  subjectId = s.body.subjects[0].id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('POST /api/sessions', () => {
  it('creates session with CONFIRMED status', async () => {
    const res = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-27T14:00:00.000Z', durationMin: 60 });
    expect(res.status).toBe(201);
    expect(res.body.durationMin).toBe(60);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.studentSubject.student.name).toBe('Максим Котов');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sessions', () => {
  it('returns sessions for given week', async () => {
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-23T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).get('/api/sessions?week=2026-06-23').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty array for different week', async () => {
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-23T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).get('/api/sessions?week=2026-06-30').set(auth());
    expect(res.body).toHaveLength(0);
  });

  it('returns all sessions when no week param', async () => {
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-23T14:00:00.000Z', durationMin: 60 });
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-07-05T10:00:00.000Z', durationMin: 90 });
    const res = await request(app).get('/api/sessions').set(auth());
    expect(res.body).toHaveLength(2);
  });
});

describe('PATCH /api/sessions/:id', () => {
  it('updates session status', async () => {
    const create = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-27T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).patch(`/api/sessions/${create.body.id}`).set(auth())
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('updates startTime and durationMin', async () => {
    const create = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-27T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).patch(`/api/sessions/${create.body.id}`).set(auth())
      .send({ durationMin: 90 });
    expect(res.body.durationMin).toBe(90);
  });
});

describe('DELETE /api/sessions/:id', () => {
  it('deletes session and returns 204', async () => {
    const create = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-27T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).delete(`/api/sessions/${create.body.id}`).set(auth());
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/sessions').set(auth());
    expect(list.body).toHaveLength(0);
  });
});
