# TutorDesk — Tech Spec

## Обзор

Дашборд репетитора. Single-tutor приложение. Backend = source of truth, frontend = рендер + запросы.

---

## Стек

| Слой | Технология |
|------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| ORM | Prisma 5 |
| DB | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Frontend | React 18, Vite 5 |
| Роутинг | React Router 6 |
| Data fetching | TanStack Query 5 |
| HTTP client | axios |
| Стили | Tailwind CSS 3 |
| Тесты | Jest 29 + Supertest |
| Контейнеры | Docker + docker-compose |

---

## Структура проекта

```
tutor/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── app.js              # Express app, все маршруты
│   │   ├── server.js           # app.listen()
│   │   ├── prisma.js           # PrismaClient singleton
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT Bearer verify → req.tutor
│   │   │   └── errorHandler.js # P2025 → 404, fallback 500
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/login
│   │   │   ├── students.js     # CRUD + full profile GET /:id
│   │   │   ├── sessions.js     # CRUD + ?week filter
│   │   │   ├── homework.js     # PATCH /:id
│   │   │   ├── topics.js       # POST, PATCH, DELETE
│   │   │   ├── notes.js        # POST, PATCH, DELETE
│   │   │   ├── payments.js     # CRUD + ?studentId filter
│   │   │   ├── dashboard.js    # GET /api/dashboard
│   │   │   ├── finance.js      # GET /api/finance?month=
│   │   │   └── settings.js     # GET/PATCH profile, PATCH /password
│   │   └── services/
│   │       ├── students.js     # generateInitials(name)
│   │       ├── homework.js     # isOverdue(homework, session)
│   │       └── activity.js     # getRecentActivity(limit) — UNION
│   └── tests/
│       ├── helpers/db.js       # cleanDb, seedTutor, getAuthToken
│       ├── health.test.js
│       ├── auth.test.js
│       ├── students.test.js
│       ├── sessions.test.js
│       ├── homeworkTopicsNotes.test.js
│       ├── payments.test.js
│       ├── dashboard.test.js
│       ├── finance.test.js
│       └── settings.test.js
├── frontend/                   # ← ещё не создан
├── docs/
│   ├── worklog.md
│   ├── techspec.md
│   ├── session-handoff.md
│   └── superpowers/
│       ├── specs/2026-06-27-tutordesk-design.md
│       └── plans/
│           ├── 2026-06-27-tutordesk-backend.md
│           └── 2026-06-27-tutordesk-frontend.md
├── docker-compose.yml
└── README.md
```

---

## База данных

### Модели Prisma

```prisma
model Tutor {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  ratePerHour  Decimal  @db.Decimal(10,2)
  timezone     String   @default("Europe/Moscow")
  students     Student[]
}

model Student {
  id            String           @id @default(cuid())
  name          String
  initials      String?          // nullable, auto-gen из name при POST
  color         String           @default("#4F46E5")
  phone         String
  parentContact String?
  enrolledSince DateTime         @default(now())
  createdAt     DateTime         @default(now())
  subjects      StudentSubject[]
  payments      Payment[]
  notes         Note[]
}

model StudentSubject {
  id          String    @id @default(cuid())
  studentId   String
  subject     String
  level       String
  ratePerHour Decimal?  @db.Decimal(10,2)  // nullable, fallback → tutor.ratePerHour
  student     Student   @relation(...)
  topics      Topic[]
  sessions    Session[]
}

model Topic {
  id               String         @id @default(cuid())
  studentSubjectId String
  title            String
  completed        Boolean        @default(false)
  sortOrder        Int            @default(0)
  studentSubject   StudentSubject @relation(...)
}

model Session {
  id               String         @id @default(cuid())
  studentSubjectId String
  startTime        DateTime
  durationMin      Int
  status           SessionStatus  @default(CONFIRMED)
  studentSubject   StudentSubject @relation(...)
  homework         Homework[]
}

model Homework {
  id        String         @id @default(cuid())
  sessionId String
  title     String
  status    HomeworkStatus @default(ASSIGNED)
  grade     Int?
  updatedAt DateTime       @updatedAt
  session   Session        @relation(...)
  // OVERDUE вычисляется: status=ASSIGNED AND session.startTime < NOW()-7d
}

model Payment {
  id        String         @id @default(cuid())
  studentId String
  amount    Decimal        @db.Decimal(10,2)
  method    PaymentMethod?
  status    PaymentStatus  @default(PENDING)
  paidAt    DateTime?
  dueDate   DateTime
  createdAt DateTime       @default(now())
  student   Student        @relation(...)
}

model Note {
  id        String   @id @default(cuid())
  studentId String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  student   Student  @relation(...)
}
```

### Enums

```prisma
enum SessionStatus  { CONFIRMED UNCONFIRMED COMPLETED CANCELLED }
enum HomeworkStatus { ASSIGNED SUBMITTED CHECKED }
enum PaymentMethod  { CARD CASH TRANSFER }
enum PaymentStatus  { PAID PENDING OVERDUE }
```

### Связи (цепочки)

```
Payment   → Student
Note      → Student
Session   → StudentSubject → Student
Homework  → Session → StudentSubject → Student
Topic     → StudentSubject → Student
```

---

## API

Все маршруты: `/api/*`  
Авторизация (кроме login): `Authorization: Bearer <JWT>`  
JWT payload: `{ id, email }`, срок 7d

### Эндпоинты

| Method | Route | Body / Query | Ответ |
|--------|-------|-------------|-------|
| POST | `/api/auth/login` | `{email, password}` | `{token, tutor}` |
| GET | `/api/dashboard` | — | `{todaySessions, weekSessions, recentActivity, stats}` |
| GET | `/api/students` | — | `Student[]` с subjects + last payment |
| POST | `/api/students` | `{name, phone, subject, level, initials?, color?, rate?}` | `Student` 201 |
| GET | `/api/students/:id` | — | full profile |
| PATCH | `/api/students/:id` | `{name?, phone?, initials?, color?, parentContact?}` | `Student` |
| DELETE | `/api/students/:id` | — | 204 |
| GET | `/api/sessions` | `?week=YYYY-MM-DD` | `Session[]` |
| POST | `/api/sessions` | `{studentSubjectId, startTime, durationMin}` | `Session` 201 |
| PATCH | `/api/sessions/:id` | `{status?, startTime?, durationMin?}` | `Session` |
| DELETE | `/api/sessions/:id` | — | 204 |
| PATCH | `/api/homework/:id` | `{status?, grade?}` | `Homework` |
| POST | `/api/topics` | `{studentSubjectId, title, sortOrder?}` | `Topic` 201 |
| PATCH | `/api/topics/:id` | `{completed?, title?}` | `Topic` |
| DELETE | `/api/topics/:id` | — | 204 |
| POST | `/api/notes` | `{studentId, content}` | `Note` 201 |
| PATCH | `/api/notes/:id` | `{content}` | `Note` |
| DELETE | `/api/notes/:id` | — | 204 |
| GET | `/api/payments` | `?studentId=` | `Payment[]` |
| POST | `/api/payments` | `{studentId, amount, method, dueDate, status?}` | `Payment` 201 |
| PATCH | `/api/payments/:id` | `{status?, method?, amount?, dueDate?}` | `Payment` |
| DELETE | `/api/payments/:id` | — | 204 |
| GET | `/api/finance` | `?month=YYYY-MM` | `{payments, total, byMethod, pending}` |
| GET | `/api/settings` | — | `Tutor` (без passwordHash) |
| PATCH | `/api/settings` | `{name?, email?, ratePerHour?, timezone?}` | `Tutor` |
| PATCH | `/api/settings/password` | `{currentPassword, newPassword}` | `{ok: true}` |

### Error handling

| Условие | HTTP |
|---------|------|
| Prisma P2025 (not found) | 404 |
| `err.status` (ручное) | `err.status` |
| Иначе | 500 |

---

## Ключевые бизнес-правила

**Homework OVERDUE** — не хранится. Вычисляется в `services/homework.js`:
```js
function isOverdue(homework, session) {
  if (homework.status !== 'ASSIGNED') return false;
  const threshold = new Date(session.startTime.getTime() + 7 * 24 * 3600 * 1000);
  return new Date() > threshold;
}
```
Добавляется к каждому объекту homework в `GET /students/:id`.

**initials** — автогенерируется при POST /students если не передан:
```js
function generateInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
```

**Activity feed** — в `services/activity.js` объединяет последние N записей из payments + sessions + homework, сортирует по дате, возвращает unified массив с полем `type`.

**Rate per hour** — `studentSubject.ratePerHour ?? tutor.ratePerHour`. Логика на фронтенде при отображении (бэкенд хранит оба значения).

**Month earnings** — фильтруется по `createdAt` (не `dueDate`) и `status = PAID`.

---

## Тестирование

```bash
cd backend && npm test          # все тесты
npm test -- tests/auth.test.js  # один файл
```

- `NODE_ENV=test` → читает `.env.test` → DB `tutordesk_test`
- `--runInBand` — последовательно (одна DB, `beforeEach` чистит через TRUNCATE)
- `tests/helpers/db.js` — `cleanDb()`, `seedTutor()`, `getAuthToken(app)`

**Текущее покрытие:** 9 суитов, 56 тестов, 100% pass

---

## Окружение

### .env (dev)
```
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk
JWT_SECRET=tutordesk_jwt_secret_dev
PORT=3001
```

### .env.test
```
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk_test
JWT_SECRET=tutordesk_jwt_secret_test
PORT=3002
```

### Команды
```bash
npm run dev          # node --watch src/server.js
npm run start        # production
npm test             # jest --runInBand
npm run db:migrate   # prisma migrate dev
npm run db:seed      # node prisma/seed.js → tutor@tutordesk.ru / password123
npm run db:generate  # prisma generate
```

### Docker
```bash
docker-compose up    # db + backend (3001) + frontend (5173)
```

---

## Frontend (план, не начат)

**Стек:** React 18 + Vite 5 + React Router 6 + TanStack Query 5 + axios + Tailwind CSS 3

```
frontend/src/
  api/          # axios instance (VITE_API_URL) + domain wrappers
  components/   # Badge, Avatar, Modal, Toast, Button, Table
  pages/        # Dashboard, Students, StudentProfile, Schedule,
                # Homework, Finance, Settings
  hooks/        # useStudents, useSessions, useFinance, useAuth
  context/      # AuthContext (JWT storage, login/logout)
  App.jsx       # Router + PrivateRoute + Layout
```

**Задачи по плану:**
- F-01: scaffold + deps
- F-02: login page
- F-03: layout shell (sidebar)
- F-04 – F-09: по странице

---

## Миграции

| Дата | Название | Изменение |
|------|---------|-----------|
| 2026-06-27 | `init` | Все модели |
| 2026-06-27 | `add_payment_created_at` | `Payment.createdAt DateTime @default(now())` |
