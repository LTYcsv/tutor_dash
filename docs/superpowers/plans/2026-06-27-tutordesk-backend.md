# TutorDesk Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Express + PostgreSQL REST API for TutorDesk — all business logic, aggregations, and computed fields live here.

**Architecture:** Express app with Prisma ORM. Single-tutor model — JWT from auth identifies the tutor, no `tutor_id` FK on domain tables. Computed fields (homework OVERDUE, activity feed) derived at query time via service layer, no cron jobs.

**Tech Stack:** Node.js 20 · Express 4 · Prisma 5 · PostgreSQL 16 · Jest 29 · Supertest · bcryptjs · jsonwebtoken

## Global Constraints

- Node.js >= 20
- All routes under `/api/*`; protected routes require `Authorization: Bearer <token>`
- Passwords: bcryptjs, saltRounds=12
- JWT: signed with `JWT_SECRET` env var, expires `7d`
- Decimal amounts: stored as `Decimal` in Prisma, returned as strings in JSON — frontend parses
- Tests: `NODE_ENV=test`, `--runInBand` (no parallel DB writes), separate test DB via `.env.test`
- Prisma client: singleton at `src/prisma.js`, imported everywhere

---

### Task 1: Project Scaffold + Prisma Schema + Health Check

**Files:**
- Create: `backend/package.json`
- Create: `backend/jest.config.js`
- Create: `backend/.env.example`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/prisma.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/middleware/errorHandler.js`
- Create: `backend/tests/helpers/db.js`
- Create: `backend/tests/health.test.js`
- Create: `docker-compose.yml` (repo root)
- Create: `backend/Dockerfile`

**Interfaces:**
- Produces: `app` (Express instance, exported from `src/app.js`), `GET /api/health → { ok: true }`
- Produces: Prisma singleton at `src/prisma.js` — used by all routes and services

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "tutordesk-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "NODE_ENV=test jest --runInBand",
    "db:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "prisma": "^5.0.0",
    "supertest": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `backend/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/helpers/db.js']
};
```

- [ ] **Step 3: Create `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tutor {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  ratePerHour  Decimal  @db.Decimal(10, 2)
  timezone     String   @default("Europe/Moscow")
  updatedAt    DateTime @updatedAt
}

model Student {
  id            String    @id @default(cuid())
  name          String
  initials      String?
  color         String    @default("#4F46E5")
  phone         String
  parentContact String?
  enrolledSince DateTime  @default(now())
  createdAt     DateTime  @default(now())

  subjects StudentSubject[]
  payments Payment[]
  notes    Note[]
}

model StudentSubject {
  id          String   @id @default(cuid())
  studentId   String
  subject     String
  level       String
  ratePerHour Decimal? @db.Decimal(10, 2)

  student  Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  topics   Topic[]
  sessions Session[]
}

model Topic {
  id               String  @id @default(cuid())
  studentSubjectId String
  title            String
  completed        Boolean @default(false)
  sortOrder        Int     @default(0)

  studentSubject StudentSubject @relation(fields: [studentSubjectId], references: [id], onDelete: Cascade)
}

model Session {
  id               String        @id @default(cuid())
  studentSubjectId String
  startTime        DateTime
  durationMin      Int
  status           SessionStatus @default(CONFIRMED)

  studentSubject StudentSubject @relation(fields: [studentSubjectId], references: [id], onDelete: Cascade)
  homework       Homework[]
}

enum SessionStatus {
  CONFIRMED
  UNCONFIRMED
  COMPLETED
  CANCELLED
}

model Homework {
  id        String         @id @default(cuid())
  sessionId String
  title     String
  status    HomeworkStatus @default(ASSIGNED)
  grade     Int?
  updatedAt DateTime       @updatedAt

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

enum HomeworkStatus {
  ASSIGNED
  SUBMITTED
  CHECKED
}

model Payment {
  id        String         @id @default(cuid())
  studentId String
  amount    Decimal        @db.Decimal(10, 2)
  method    PaymentMethod?
  status    PaymentStatus  @default(PENDING)
  paidAt    DateTime?
  dueDate   DateTime

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

enum PaymentMethod {
  CARD
  CASH
  TRANSFER
}

enum PaymentStatus {
  PAID
  PENDING
  OVERDUE
}

model Note {
  id        String   @id @default(cuid())
  studentId String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 4: Create `backend/.env.example`**

```
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk
JWT_SECRET=change_me_in_production
PORT=3001
```

Create `backend/.env` and `backend/.env.test` from this template. `.env.test` should point to a separate DB: `postgresql://tutor:tutor@localhost:5432/tutordesk_test`.

- [ ] **Step 5: Create `backend/src/prisma.js`**

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

- [ ] **Step 6: Create `backend/src/middleware/errorHandler.js`**

```js
function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.code === 'P2025' ? 404 : err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
```

(`P2025` is Prisma's "record not found" code — maps to 404.)

- [ ] **Step 7: Create `backend/src/app.js`**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Routes registered in later tasks — stubs added here as placeholders
// that get replaced task-by-task:
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api', require('./middleware/auth').authenticate);
// app.use('/api/dashboard', require('./routes/dashboard'));
// ... etc.

app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 8: Create `backend/src/server.js`**

```js
const app = require('./app');
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

- [ ] **Step 9: Create `backend/tests/helpers/db.js`**

```js
require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const prisma = new PrismaClient();

async function cleanDb() {
  await prisma.$executeRaw`TRUNCATE TABLE "Note", "Payment", "Homework", "Topic", "Session", "StudentSubject", "Student", "Tutor" CASCADE`;
}

async function seedTutor(overrides = {}) {
  const passwordHash = await bcrypt.hash(overrides.password || 'password123', 12);
  return prisma.tutor.create({
    data: {
      name: 'Test Tutor',
      email: 'tutor@test.com',
      passwordHash,
      ratePerHour: 1500,
      timezone: 'Europe/Moscow',
      ...overrides,
      passwordHash
    }
  });
}

async function getAuthToken(app) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@test.com', password: 'password123' });
  return res.body.token;
}

afterAll(() => prisma.$disconnect());

module.exports = { prisma, cleanDb, seedTutor, getAuthToken };
```

- [ ] **Step 10: Write the failing health test**

`backend/tests/health.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 11: Install deps and run test to verify it passes**

```bash
cd backend
npm install
npx prisma generate
# start test DB (Docker must be running):
# docker compose up db -d
npx prisma migrate deploy --schema prisma/schema.prisma
npm test -- tests/health.test.js
```

Expected: `PASS tests/health.test.js`

- [ ] **Step 12: Create `docker-compose.yml` at repo root**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tutordesk
      POSTGRES_USER: tutor
      POSTGRES_PASSWORD: tutor
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
  backend:
    build: ./backend
    depends_on: [db]
    ports:
      - "3001:3001"
    env_file: ./backend/.env
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3001
volumes:
  pgdata:
```

- [ ] **Step 13: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

- [ ] **Step 14: Commit**

```bash
git add backend/ docker-compose.yml
git commit -m "feat(backend): scaffold Express app, Prisma schema, health check"
```

---

### Task 2: Auth — POST /api/auth/login + JWT Middleware

**Files:**
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/middleware/auth.js`
- Modify: `backend/src/app.js` (register routes)
- Create: `backend/tests/auth.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces: `POST /api/auth/login → { token: string, tutor: TutorWithoutHash }`
- Produces: `authenticate` middleware — sets `req.tutor = { id, email }` on success, returns 401 on failure

- [ ] **Step 1: Write failing tests**

`backend/tests/auth.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/auth.test.js
```

Expected: FAIL — routes not registered yet.

- [ ] **Step 3: Create `backend/src/routes/auth.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const tutor = await prisma.tutor.findUnique({ where: { email } });
    if (!tutor) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, tutor.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: tutor.id, email: tutor.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...tutorData } = tutor;
    res.json({ token, tutor: tutorData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 4: Create `backend/src/middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.tutor = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };
```

- [ ] **Step 5: Update `backend/src/app.js` to register auth and middleware**

Replace the stub in app.js with:
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));

// All routes below this line require JWT
app.use('/api', authenticate);

// Route stubs — uncomment as each task completes:
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/students', require('./routes/students'));
// app.use('/api/sessions', require('./routes/sessions'));
// app.use('/api/finance', require('./routes/finance'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/homework', require('./routes/homework'));
// app.use('/api/topics', require('./routes/topics'));
// app.use('/api/notes', require('./routes/notes'));
// app.use('/api/settings', require('./routes/settings'));

app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/auth.test.js
```

Expected: `PASS tests/auth.test.js` (4 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/auth.js backend/src/middleware/ backend/src/app.js backend/tests/auth.test.js
git commit -m "feat(backend): JWT auth login + authenticate middleware"
```

---

### Task 3: Students CRUD

**Files:**
- Create: `backend/src/routes/students.js`
- Create: `backend/src/services/students.js`
- Modify: `backend/src/app.js` (uncomment students route)
- Create: `backend/tests/students.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`, `middleware/auth.js`
- Produces:
  - `GET /api/students → Student[]` (with first subject + payment status)
  - `POST /api/students → Student` (201, with subject created)
  - `PATCH /api/students/:id → Student`
  - `DELETE /api/students/:id → 204`
- Produces: `generateInitials(name: string): string` from `services/students.js`

- [ ] **Step 1: Write failing tests**

`backend/tests/students.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

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
  it('updates student fields', async () => {
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
    const res = await request(app)
      .delete(`/api/students/${create.body.id}`)
      .set(auth());
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/students').set(auth());
    expect(list.body).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/students.test.js
```

Expected: FAIL — route not registered.

- [ ] **Step 3: Create `backend/src/services/students.js`**

```js
function generateInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

module.exports = { generateInitials };
```

- [ ] **Step 4: Create `backend/src/routes/students.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const { generateInitials } = require('../services/students');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        subjects: true,
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, initials, color, phone, parentContact, subject, level, rate } = req.body;
    if (!name || !phone || !subject || !level) {
      return res.status(400).json({ error: 'name, phone, subject, level required' });
    }
    const student = await prisma.student.create({
      data: {
        name,
        initials: initials || generateInitials(name),
        color: color || '#4F46E5',
        phone,
        parentContact: parentContact || null,
        subjects: {
          create: { subject, level, ratePerHour: rate || null }
        }
      },
      include: { subjects: true }
    });
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, initials, color, phone, parentContact } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(initials !== undefined && { initials }),
        ...(color && { color }),
        ...(phone && { phone }),
        ...(parentContact !== undefined && { parentContact })
      }
    });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 5: Uncomment students route in `backend/src/app.js`**

```js
app.use('/api/students', require('./routes/students'));
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/students.test.js
```

Expected: `PASS tests/students.test.js` (6 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/students.js backend/src/services/students.js backend/src/app.js backend/tests/students.test.js
git commit -m "feat(backend): students CRUD with auto-initials"
```

---

### Task 4: Student Full Profile — GET /api/students/:id

**Files:**
- Modify: `backend/src/routes/students.js` (add GET /:id)
- Create: `backend/src/services/homework.js`
- Create: `backend/tests/studentProfile.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`, `services/homework.js`
- Produces: `GET /api/students/:id → Student` with nested `subjects[].topics`, `subjects[].sessions[].homework[].isOverdue`, `payments`, `notes`
- Produces: `isOverdue(homework, session): boolean` from `services/homework.js`

- [ ] **Step 1: Create `backend/src/services/homework.js`**

```js
const OVERDUE_DAYS = 7;

function isOverdue(homework, session) {
  if (homework.status !== 'ASSIGNED') return false;
  const threshold = new Date(
    new Date(session.startTime).getTime() + OVERDUE_DAYS * 24 * 60 * 60 * 1000
  );
  return new Date() > threshold;
}

module.exports = { isOverdue };
```

- [ ] **Step 2: Write failing tests**

`backend/tests/studentProfile.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

let token, studentId, subjectId;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
  const create = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Максим Котов', phone: '+7 916 111', subject: 'Математика', level: 'B2' });
  studentId = create.body.id;
  subjectId = create.body.subjects[0].id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/students/:id', () => {
  it('returns full student profile', async () => {
    const res = await request(app).get(`/api/students/${studentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(studentId);
    expect(Array.isArray(res.body.subjects)).toBe(true);
    expect(Array.isArray(res.body.payments)).toBe(true);
    expect(Array.isArray(res.body.notes)).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/students/nonexistent').set(auth());
    expect(res.status).toBe(404);
  });

  it('includes topics under subjects', async () => {
    await prisma.topic.create({ data: { studentSubjectId: subjectId, title: 'Линейные уравнения', completed: true, sortOrder: 0 } });
    const res = await request(app).get(`/api/students/${studentId}`).set(auth());
    expect(res.body.subjects[0].topics).toHaveLength(1);
    expect(res.body.subjects[0].topics[0].title).toBe('Линейные уравнения');
  });

  it('marks homework as isOverdue when ASSIGNED and session is old', async () => {
    const oldSession = await prisma.session.create({
      data: {
        studentSubjectId: subjectId,
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        durationMin: 60,
        status: 'COMPLETED'
      }
    });
    await prisma.homework.create({
      data: { sessionId: oldSession.id, title: 'Задание', status: 'ASSIGNED' }
    });
    const res = await request(app).get(`/api/students/${studentId}`).set(auth());
    const hw = res.body.subjects[0].sessions[0].homework[0];
    expect(hw.isOverdue).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify tests fail**

```bash
cd backend && npm test -- tests/studentProfile.test.js
```

Expected: FAIL — GET /:id not implemented.

- [ ] **Step 4: Add GET /:id to `backend/src/routes/students.js`**

Add before `module.exports`:
```js
const { isOverdue } = require('../services/homework');

router.get('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        subjects: {
          include: {
            topics: { orderBy: { sortOrder: 'asc' } },
            sessions: {
              include: { homework: true },
              orderBy: { startTime: 'desc' }
            }
          }
        },
        payments: { orderBy: { dueDate: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } }
      }
    });

    const result = {
      ...student,
      subjects: student.subjects.map(sub => ({
        ...sub,
        sessions: sub.sessions.map(session => ({
          ...session,
          homework: session.homework.map(hw => ({
            ...hw,
            isOverdue: isOverdue(hw, session)
          }))
        }))
      }))
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});
```

Note: Place this GET `/:id` route **before** PATCH `/:id` and DELETE `/:id` — otherwise Express matches `/:id` as PATCH/DELETE only for non-GET. Actually route order matters only for same method + same path, so order doesn't matter here. But conventionally, GET before PATCH/DELETE.

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/studentProfile.test.js
```

Expected: `PASS tests/studentProfile.test.js` (4 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/students.js backend/src/services/homework.js backend/tests/studentProfile.test.js
git commit -m "feat(backend): student full profile with computed homework overdue"
```

---

### Task 5: Sessions API

**Files:**
- Create: `backend/src/routes/sessions.js`
- Modify: `backend/src/app.js` (uncomment sessions route)
- Create: `backend/tests/sessions.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces:
  - `GET /api/sessions?week=YYYY-MM-DD → Session[]` (Mon–Sun of that week, with student info)
  - `POST /api/sessions → Session` (201)
  - `PATCH /api/sessions/:id → Session`
  - `DELETE /api/sessions/:id → 204`

- [ ] **Step 1: Write failing tests**

`backend/tests/sessions.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

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
  it('creates session', async () => {
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
  it('returns sessions for week', async () => {
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
});

describe('DELETE /api/sessions/:id', () => {
  it('deletes session', async () => {
    const create = await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: '2026-06-27T14:00:00.000Z', durationMin: 60 });
    const res = await request(app).delete(`/api/sessions/${create.body.id}`).set(auth());
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/sessions.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `backend/src/routes/sessions.js`**

```js
const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { week } = req.query;
    let where = {};
    if (week) {
      const monday = new Date(week);
      const sunday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
      where = { startTime: { gte: monday, lt: sunday } };
    }
    const sessions = await prisma.session.findMany({
      where,
      include: {
        studentSubject: { include: { student: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { studentSubjectId, startTime, durationMin, status } = req.body;
    if (!studentSubjectId || !startTime || !durationMin) {
      return res.status(400).json({ error: 'studentSubjectId, startTime, durationMin required' });
    }
    const session = await prisma.session.create({
      data: {
        studentSubjectId,
        startTime: new Date(startTime),
        durationMin: Number(durationMin),
        status: status || 'CONFIRMED'
      },
      include: { studentSubject: { include: { student: true } } }
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, startTime, durationMin } = req.body;
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(durationMin && { durationMin: Number(durationMin) })
      }
    });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 4: Uncomment sessions route in `backend/src/app.js`**

```js
app.use('/api/sessions', require('./routes/sessions'));
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/sessions.test.js
```

Expected: `PASS tests/sessions.test.js` (6 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/sessions.js backend/src/app.js backend/tests/sessions.test.js
git commit -m "feat(backend): sessions CRUD + weekly filter"
```

---

### Task 6: Homework + Topics + Notes Endpoints

**Files:**
- Create: `backend/src/routes/homework.js`
- Create: `backend/src/routes/topics.js`
- Create: `backend/src/routes/notes.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/homeworkTopicsNotes.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces:
  - `PATCH /api/homework/:id → Homework`
  - `POST /api/topics → Topic` (201)
  - `PATCH /api/topics/:id → Topic`
  - `DELETE /api/topics/:id → 204`
  - `POST /api/notes → Note` (201)
  - `PATCH /api/notes/:id → Note`
  - `DELETE /api/notes/:id → 204`

- [ ] **Step 1: Write failing tests**

`backend/tests/homeworkTopicsNotes.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/homeworkTopicsNotes.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `backend/src/routes/homework.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, grade } = req.body;
    const hw = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(grade !== undefined && { grade: grade !== null ? Number(grade) : null })
      }
    });
    res.json(hw);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 4: Create `backend/src/routes/topics.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { studentSubjectId, title, sortOrder } = req.body;
    if (!studentSubjectId || !title) {
      return res.status(400).json({ error: 'studentSubjectId and title required' });
    }
    const topic = await prisma.topic.create({
      data: { studentSubjectId, title, sortOrder: sortOrder ?? 0 }
    });
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { completed, title } = req.body;
    const topic = await prisma.topic.update({
      where: { id: req.params.id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title && { title })
      }
    });
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.topic.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 5: Create `backend/src/routes/notes.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { studentId, content } = req.body;
    if (!studentId || !content) {
      return res.status(400).json({ error: 'studentId and content required' });
    }
    const note = await prisma.note.create({ data: { studentId, content } });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { content } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { content }
    });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 6: Uncomment routes in `backend/src/app.js`**

```js
app.use('/api/homework', require('./routes/homework'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/notes', require('./routes/notes'));
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/homeworkTopicsNotes.test.js
```

Expected: `PASS` (7 tests)

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/homework.js backend/src/routes/topics.js backend/src/routes/notes.js backend/src/app.js backend/tests/homeworkTopicsNotes.test.js
git commit -m "feat(backend): homework, topics, notes endpoints"
```

---

### Task 7: Payments API

**Files:**
- Create: `backend/src/routes/payments.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/payments.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces:
  - `POST /api/payments → Payment` (201)
  - `PATCH /api/payments/:id → Payment` (auto-sets `paidAt` when status=PAID)
  - `POST /api/payments/:id/remind → { ok: true }` (MVP no-op)

- [ ] **Step 1: Write failing tests**

`backend/tests/payments.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

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
  it('creates payment with PENDING status', async () => {
    const res = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 5000, dueDate: '2026-07-01T00:00:00.000Z' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.paidAt).toBeNull();
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/payments').set(auth())
      .send({ studentId });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/payments/:id', () => {
  it('marks payment as PAID and sets paidAt', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 5000, dueDate: '2026-07-01T00:00:00.000Z' });
    const res = await request(app).patch(`/api/payments/${create.body.id}`).set(auth())
      .send({ status: 'PAID' });
    expect(res.body.status).toBe('PAID');
    expect(res.body.paidAt).not.toBeNull();
  });

  it('updates method', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 5000, dueDate: '2026-07-01T00:00:00.000Z' });
    const res = await request(app).patch(`/api/payments/${create.body.id}`).set(auth())
      .send({ method: 'CARD', status: 'PAID' });
    expect(res.body.method).toBe('CARD');
  });
});

describe('POST /api/payments/:id/remind', () => {
  it('returns ok', async () => {
    const create = await request(app).post('/api/payments').set(auth())
      .send({ studentId, amount: 5000, dueDate: '2026-07-01T00:00:00.000Z' });
    const res = await request(app).post(`/api/payments/${create.body.id}/remind`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/payments.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `backend/src/routes/payments.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { studentId, amount, method, dueDate } = req.body;
    if (!studentId || !amount || !dueDate) {
      return res.status(400).json({ error: 'studentId, amount, dueDate required' });
    }
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount,
        method: method || null,
        dueDate: new Date(dueDate)
      }
    });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, method, paidAt } = req.body;
    const data = {};
    if (status) data.status = status;
    if (method !== undefined) data.method = method || null;
    if (paidAt !== undefined) data.paidAt = paidAt ? new Date(paidAt) : null;
    if (status === 'PAID' && paidAt === undefined) data.paidAt = new Date();

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data
    });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/remind', async (req, res, next) => {
  try {
    await prisma.payment.findUniqueOrThrow({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 4: Uncomment in `backend/src/app.js`**

```js
app.use('/api/payments', require('./routes/payments'));
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/payments.test.js
```

Expected: `PASS` (5 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/payments.js backend/src/app.js backend/tests/payments.test.js
git commit -m "feat(backend): payments CRUD + remind no-op"
```

---

### Task 8: Activity Service + Dashboard API

**Files:**
- Create: `backend/src/services/activity.js`
- Create: `backend/src/routes/dashboard.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/dashboard.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces: `getRecentActivity(days?: number): ActivityEvent[]`
  - `ActivityEvent: { type: string, text: string, time: Date, icon: string }`
- Produces: `GET /api/dashboard → { metrics, todaySessions, recentActivity }`
  - `metrics: { studentCount, sessionsThisMonth, incomeThisMonth, overduePayments }`

- [ ] **Step 1: Create `backend/src/services/activity.js`**

```js
const prisma = require('../prisma');

async function getRecentActivity(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [payments, homework, sessions] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: since }, status: 'PAID' },
      include: { student: { select: { name: true } } },
      orderBy: { paidAt: 'desc' },
      take: 10
    }),
    prisma.homework.findMany({
      where: { updatedAt: { gte: since }, status: { not: 'ASSIGNED' } },
      include: {
        session: {
          include: {
            studentSubject: { include: { student: { select: { name: true } } } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    }),
    prisma.session.findMany({
      where: { startTime: { gte: since }, status: 'COMPLETED' },
      include: {
        studentSubject: { include: { student: { select: { name: true } } } }
      },
      orderBy: { startTime: 'desc' },
      take: 10
    })
  ]);

  const events = [
    ...payments.map(p => ({
      type: 'payment',
      text: `${p.student.name} оплатил(а) ₽${p.amount}`,
      time: p.paidAt,
      icon: '💸'
    })),
    ...homework.map(h => ({
      type: 'homework',
      text: `${h.session.studentSubject.student.name} ${
        h.status === 'SUBMITTED' ? 'сдал(а)' : 'выполнил(а)'
      } домашнее задание`,
      time: h.updatedAt,
      icon: '📝'
    })),
    ...sessions.map(s => ({
      type: 'session',
      text: `Занятие с ${s.studentSubject.student.name} завершено`,
      time: s.startTime,
      icon: '✅'
    }))
  ];

  return events
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);
}

module.exports = { getRecentActivity };
```

- [ ] **Step 2: Write failing tests**

`backend/tests/dashboard.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

let token;

beforeEach(async () => {
  await cleanDb();
  await seedTutor();
  token = await getAuthToken(app);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/dashboard', () => {
  it('returns metrics with zero values when no data', async () => {
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.metrics.studentCount).toBe(0);
    expect(res.body.metrics.sessionsThisMonth).toBe(0);
    expect(res.body.todaySessions).toEqual([]);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it('counts students correctly', async () => {
    await request(app).post('/api/students').set(auth())
      .send({ name: 'Ученик 1', phone: '+7', subject: 'Математика', level: 'B1' });
    await request(app).post('/api/students').set(auth())
      .send({ name: 'Ученик 2', phone: '+7', subject: 'Английский', level: 'A2' });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.body.metrics.studentCount).toBe(2);
  });

  it('includes today sessions', async () => {
    const s = await request(app).post('/api/students').set(auth())
      .send({ name: 'Ученик', phone: '+7', subject: 'Математика', level: 'B1' });
    const subjectId = s.body.subjects[0].id;
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    await request(app).post('/api/sessions').set(auth())
      .send({ studentSubjectId: subjectId, startTime: today.toISOString(), durationMin: 60 });
    const res = await request(app).get('/api/dashboard').set(auth());
    expect(res.body.todaySessions).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run to verify tests fail**

```bash
cd backend && npm test -- tests/dashboard.test.js
```

Expected: FAIL

- [ ] **Step 4: Create `backend/src/routes/dashboard.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const { getRecentActivity } = require('../services/activity');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [studentCount, sessionsThisMonth, incomeAgg, overduePayments, todaySessions, recentActivity] =
      await Promise.all([
        prisma.student.count(),
        prisma.session.count({
          where: { startTime: { gte: startOfMonth }, status: { not: 'CANCELLED' } }
        }),
        prisma.payment.aggregate({
          where: { status: 'PAID', paidAt: { gte: startOfMonth } },
          _sum: { amount: true }
        }),
        prisma.payment.count({ where: { status: 'OVERDUE' } }),
        prisma.session.findMany({
          where: { startTime: { gte: startOfDay, lt: endOfDay }, status: { not: 'CANCELLED' } },
          include: { studentSubject: { include: { student: true } } },
          orderBy: { startTime: 'asc' }
        }),
        getRecentActivity()
      ]);

    res.json({
      metrics: {
        studentCount,
        sessionsThisMonth,
        incomeThisMonth: incomeAgg._sum.amount || 0,
        overduePayments
      },
      todaySessions,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 5: Uncomment in `backend/src/app.js`**

```js
app.use('/api/dashboard', require('./routes/dashboard'));
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/dashboard.test.js
```

Expected: `PASS` (3 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/activity.js backend/src/routes/dashboard.js backend/src/app.js backend/tests/dashboard.test.js
git commit -m "feat(backend): dashboard API + activity feed service"
```

---

### Task 9: Finance API

**Files:**
- Create: `backend/src/services/finance.js`
- Create: `backend/src/routes/finance.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/finance.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces: `getFinanceOverview(): { metrics, chartData, debts, paymentLog }`
  - `chartData: Array<{ month: string, amount: Decimal }>` (last 6 months)
  - `debts: Payment[]` with `student` embedded
  - `metrics: { incomeThisMonth, totalDebt, debtorCount, avgCheck }`
- Produces: `GET /api/finance → getFinanceOverview()`

- [ ] **Step 1: Create `backend/src/services/finance.js`**

```js
const prisma = require('../prisma');

async function getFinanceOverview() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [incomeAgg, debtAgg, paidCountThisMonth] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amount: true },
      _count: { _all: true }
    }),
    prisma.payment.count({ where: { status: 'PAID', paidAt: { gte: startOfMonth } } })
  ]);

  // Chart: last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const agg = await prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: start, lt: end } },
      _sum: { amount: true }
    });
    chartData.push({
      month: start.toLocaleString('ru', { month: 'short' }),
      amount: agg._sum.amount || 0
    });
  }

  const [debts, paymentLog] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      include: { student: { select: { id: true, name: true, initials: true, color: true } } },
      orderBy: { dueDate: 'asc' }
    }),
    prisma.payment.findMany({
      include: { student: { select: { name: true } } },
      orderBy: { dueDate: 'desc' },
      take: 50
    })
  ]);

  const incomeThisMonth = Number(incomeAgg._sum.amount || 0);
  const avgCheck = paidCountThisMonth > 0
    ? Math.round(incomeThisMonth / paidCountThisMonth)
    : 0;

  return {
    metrics: {
      incomeThisMonth,
      totalDebt: debtAgg._sum.amount || 0,
      debtorCount: debtAgg._count._all,
      avgCheck
    },
    chartData,
    debts,
    paymentLog
  };
}

module.exports = { getFinanceOverview };
```

- [ ] **Step 2: Write failing tests**

`backend/tests/finance.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');
const { cleanDb, seedTutor, getAuthToken, prisma } = require('./helpers/db');

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
  it('returns finance overview with empty data', async () => {
    const res = await request(app).get('/api/finance').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body).toHaveProperty('chartData');
    expect(res.body).toHaveProperty('debts');
    expect(res.body).toHaveProperty('paymentLog');
    expect(res.body.chartData).toHaveLength(6);
  });

  it('counts paid income for current month', async () => {
    const dueDate = new Date().toISOString();
    const p = await prisma.payment.create({ data: { studentId, amount: 5000, dueDate, status: 'PAID', paidAt: new Date() } });
    const res = await request(app).get('/api/finance').set(auth());
    expect(Number(res.body.metrics.incomeThisMonth)).toBe(5000);
  });

  it('counts overdue debts', async () => {
    await prisma.payment.create({ data: { studentId, amount: 3000, dueDate: new Date(), status: 'OVERDUE' } });
    const res = await request(app).get('/api/finance').set(auth());
    expect(res.body.metrics.debtorCount).toBe(1);
  });
});
```

- [ ] **Step 3: Run to verify tests fail**

```bash
cd backend && npm test -- tests/finance.test.js
```

Expected: FAIL

- [ ] **Step 4: Create `backend/src/routes/finance.js`**

```js
const express = require('express');
const { getFinanceOverview } = require('../services/finance');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await getFinanceOverview());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 5: Uncomment in `backend/src/app.js`**

```js
app.use('/api/finance', require('./routes/finance'));
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/finance.test.js
```

Expected: `PASS` (3 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/finance.js backend/src/routes/finance.js backend/src/app.js backend/tests/finance.test.js
git commit -m "feat(backend): finance API + aggregation service"
```

---

### Task 10: Settings API + Seed Script

**Files:**
- Create: `backend/src/routes/settings.js`
- Create: `backend/prisma/seed.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/settings.test.js`

**Interfaces:**
- Consumes: `src/prisma.js`
- Produces: `GET /api/settings → TutorPublic` (no passwordHash)
- Produces: `PATCH /api/settings → TutorPublic`
- Produces: seed script that creates one tutor via `npm run db:seed`

- [ ] **Step 1: Write failing tests**

`backend/tests/settings.test.js`:
```js
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
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});

describe('PATCH /api/settings', () => {
  it('updates tutor name', async () => {
    const res = await request(app).patch('/api/settings').set(auth())
      .send({ name: 'Мария Иванова' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Мария Иванова');
  });

  it('updates ratePerHour', async () => {
    const res = await request(app).patch('/api/settings').set(auth())
      .send({ ratePerHour: 2000 });
    expect(Number(res.body.ratePerHour)).toBe(2000);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd backend && npm test -- tests/settings.test.js
```

Expected: FAIL

- [ ] **Step 3: Create `backend/src/routes/settings.js`**

```js
const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

const SELECT = { id: true, name: true, email: true, ratePerHour: true, timezone: true, updatedAt: true };

router.get('/', async (req, res, next) => {
  try {
    const tutor = await prisma.tutor.findFirst({ select: SELECT });
    res.json(tutor);
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { name, email, ratePerHour, timezone } = req.body;
    const tutor = await prisma.tutor.findFirst();
    const updated = await prisma.tutor.update({
      where: { id: tutor.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(ratePerHour !== undefined && { ratePerHour }),
        ...(timezone && { timezone })
      },
      select: SELECT
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

- [ ] **Step 4: Create `backend/prisma/seed.js`**

```js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('tutordesk123', 12);
  const tutor = await prisma.tutor.upsert({
    where: { email: 'anna@tutordesk.ru' },
    update: {},
    create: {
      name: 'Анна Михайлова',
      email: 'anna@tutordesk.ru',
      passwordHash,
      ratePerHour: 1500,
      timezone: 'Europe/Moscow'
    }
  });
  console.log('Seeded tutor:', tutor.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Uncomment in `backend/src/app.js`**

```js
app.use('/api/settings', require('./routes/settings'));
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npm test -- tests/settings.test.js
```

Expected: `PASS` (3 tests)

- [ ] **Step 7: Run all backend tests**

```bash
cd backend && npm test
```

Expected: All test suites pass.

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/settings.js backend/prisma/seed.js backend/src/app.js backend/tests/settings.test.js
git commit -m "feat(backend): settings API + seed script — backend complete"
```
