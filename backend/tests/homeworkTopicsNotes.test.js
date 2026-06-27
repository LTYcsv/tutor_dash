const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

let token, studentId, subjectId, sessionId;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
  const s = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ученик', phone: '+7', subject: 'Математика', level: 'B1' });
  studentId = s.body.id;
  subjectId = s.body.subjects[0].id;
  const sess = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`)
    .send({ studentSubjectId: subjectId, startTime: new Date().toISOString(), durationMin: 60 });
  sessionId = sess.body.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('PATCH /api/homework/:id', () => {
  it('updates homework status', async () => {
    const hw = await prisma.homework.create({ data: { sessionId, title: 'Задание 1', status: 'ASSIGNED' } });
    const res = await request(app).patch(`/api/homework/${hw.id}`).set(auth())
      .send({ status: 'SUBMITTED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('updates homework grade', async () => {
    const hw = await prisma.homework.create({ data: { sessionId, title: 'Задание 2', status: 'CHECKED' } });
    const res = await request(app).patch(`/api/homework/${hw.id}`).set(auth())
      .send({ grade: 5 });
    expect(res.body.grade).toBe(5);
  });
});

describe('Topics', () => {
  it('POST /api/topics creates topic', async () => {
    const res = await request(app).post('/api/topics').set(auth())
      .send({ studentSubjectId: subjectId, title: 'Тема 1', sortOrder: 0 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Тема 1');
  });

  it('POST /api/topics returns 400 without required fields', async () => {
    const res = await request(app).post('/api/topics').set(auth())
      .send({ title: 'Тема без subjectId' });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/topics/:id toggles completed', async () => {
    const t = await prisma.topic.create({ data: { studentSubjectId: subjectId, title: 'Тема', sortOrder: 0 } });
    const res = await request(app).patch(`/api/topics/${t.id}`).set(auth())
      .send({ completed: true });
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/topics/:id returns 204', async () => {
    const t = await prisma.topic.create({ data: { studentSubjectId: subjectId, title: 'Тема', sortOrder: 0 } });
    const res = await request(app).delete(`/api/topics/${t.id}`).set(auth());
    expect(res.status).toBe(204);
  });
});

describe('Notes', () => {
  it('POST /api/notes creates note', async () => {
    const res = await request(app).post('/api/notes').set(auth())
      .send({ studentId, content: 'Хорошо справился' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Хорошо справился');
  });

  it('POST /api/notes returns 400 without required fields', async () => {
    const res = await request(app).post('/api/notes').set(auth())
      .send({ studentId });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/notes/:id updates content', async () => {
    const n = await prisma.note.create({ data: { studentId, content: 'Старый текст' } });
    const res = await request(app).patch(`/api/notes/${n.id}`).set(auth())
      .send({ content: 'Новый текст' });
    expect(res.body.content).toBe('Новый текст');
  });

  it('DELETE /api/notes/:id returns 204', async () => {
    const n = await prisma.note.create({ data: { studentId, content: 'Заметка' } });
    const res = await request(app).delete(`/api/notes/${n.id}`).set(auth());
    expect(res.status).toBe(204);
  });
});
