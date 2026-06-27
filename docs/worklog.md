# TutorDesk — Work Log

## 2026-06-27 — Сессия 1: Проектирование + Backend

### Проектирование (до кода)
- Разобрали исходный `tutordesk.html` — single-file SPA с хардкодом
- Решили: переделать в полноценный backend + frontend
- Выбрали стек: Node.js + Express + PostgreSQL + Prisma + React + Vite + JWT
- Обсудили и зафиксировали архитектурные решения:
  - один репетитор — `tutor_id` не дублируется по таблицам
  - `OVERDUE` у homework — вычисляемое, не хранится (status=ASSIGNED + session.startTime < NOW()-7d)
  - activity feed = UNION из payments + homework + sessions (без отдельной таблицы)
  - `initials` = nullable String, автогенерируется из имени при POST, переопределяется через PATCH
  - `rate_per_hour` на `StudentSubject` (nullable, fallback → `tutor.ratePerHour`)
  - payments → student, не session (блочная/месячная оплата)
  - sessions → studentSubject (предмет производится через связь)
  - homework → session (student производится через chain)
  - `PaymentMethod` enum: CARD | CASH | TRANSFER
  - `HomeworkStatus` enum: ASSIGNED | SUBMITTED | CHECKED
- Написали design spec: `docs/superpowers/specs/2026-06-27-tutordesk-design.md`
- Написали планы реализации:
  - `docs/superpowers/plans/2026-06-27-tutordesk-backend.md`
  - `docs/superpowers/plans/2026-06-27-tutordesk-frontend.md`

### B-01: Scaffold
- Monorepo: `backend/` + `frontend/` + `docker-compose.yml`
- `backend/package.json`: deps (express, prisma, bcryptjs, cors, dotenv, jsonwebtoken), devDeps (jest, supertest)
- `prisma/schema.prisma`: все модели (Tutor, Student, StudentSubject, Topic, Session, Homework, Payment, Note)
- `src/app.js`, `src/server.js`, `src/prisma.js`
- `src/middleware/errorHandler.js`
- `tests/helpers/db.js`: `cleanDb()`, `seedTutor()`, `getAuthToken()`
- `.env`, `.env.test`, `.gitignore`, `backend/.gitignore`
- `docker-compose.yml`, `backend/Dockerfile`, `backend/.dockerignore`
- Миграции применены на `tutordesk` и `tutordesk_test`
- PASS `tests/health.test.js` (1 тест)

**Отладка:** `role "tutor" does not exist` → создали роль через `$(whoami)`. `P3014 permission denied` → `ALTER ROLE tutor CREATEDB`.

### B-02: Auth
- `src/routes/auth.js`: POST /api/auth/login (bcrypt compare → JWT sign, 7d)
- `src/middleware/auth.js`: Bearer token verify, `req.tutor = decoded`
- `src/app.js`: зарегистрированы auth route + authenticate middleware
- PASS `tests/auth.test.js` (5 тестов)

### B-03: Students CRUD
- `src/routes/students.js`: GET list, POST (auto-initials), GET /:id (full profile), PATCH, DELETE
- `src/services/students.js`: `generateInitials(name)`
- `src/services/homework.js`: `isOverdue(homework, session)` — вычисляет OVERDUE без хранения
- GET /:id включает: subjects → topics + sessions → homework (с `isOverdue`), payments, notes
- PASS `tests/students.test.js` (7 тестов)

**Security fix:** добавлен `backend/.dockerignore` (исключает `.env` из Docker image).

### B-05: Sessions
- `src/routes/sessions.js`: GET `?week=YYYY-MM-DD` (фильтр пн–вс), POST, PATCH, DELETE
- PASS `tests/sessions.test.js` (8 тестов)

### B-06: Homework + Topics + Notes
- `src/routes/homework.js`: PATCH /:id (status, grade)
- `src/routes/topics.js`: POST, PATCH (completed/title), DELETE
- `src/routes/notes.js`: POST, PATCH (content), DELETE
- PASS `tests/homeworkTopicsNotes.test.js` (10 тестов)

### B-07: Payments
- `src/routes/payments.js`: GET `?studentId=`, POST, PATCH, DELETE
- Баг: `description` поля нет в схеме Payment — убрали из route, получили 500, исправили.
- PASS `tests/payments.test.js` (8 тестов)

---

## 2026-06-28 — Сессия 2: Backend завершение + GitHub

### B-08: Dashboard + Activity
- `src/services/activity.js`: `getRecentActivity(limit)` — объединяет payments + sessions + homework, сортирует по дате
- `src/routes/dashboard.js`: GET /api/dashboard → `{ todaySessions, weekSessions, recentActivity, stats }`
- stats: `studentsCount`, `monthEarnings` (PAID за текущий месяц), `pendingPayments`
- Баг: Payment не имел `createdAt` → добавили поле, сделали миграцию `20260627211158_add_payment_created_at`
- PASS `tests/dashboard.test.js` (6 тестов)

### B-09: Finance
- `src/routes/finance.js`: GET /api/finance `?month=YYYY-MM` → `{ payments, total, byMethod, pending }`
- `total` = сумма PAID; `byMethod` = разбивка по CARD/CASH/TRANSFER; `pending` = сумма PENDING
- Без параметра — текущий месяц
- PASS `tests/finance.test.js` (5 тестов)

### B-10: Settings + Seed
- `src/routes/settings.js`: GET (профиль без passwordHash), PATCH (name/email/rate/timezone), PATCH /password (bcrypt verify + rehash)
- `prisma/seed.js`: создаёт 1 репетитора + 3 студентов с занятиями, платежами, темами, заметками
- Seed запускается: `npm run db:seed`
- Логин после seed: `tutor@tutordesk.ru / password123`
- PASS `tests/settings.test.js` (6 тестов)

### Итог backend
- 9 тест-суитов, **56 тестов, все pass**
- Все API endpoints реализованы и покрыты тестами
- Код запушен на GitHub: https://github.com/LTYcsv/tutor_dash

---

## Статус на 2026-06-28

| Часть | Статус |
|-------|--------|
| Backend scaffold | ✅ |
| Auth | ✅ |
| Students CRUD | ✅ |
| Sessions API | ✅ |
| Homework / Topics / Notes | ✅ |
| Payments API | ✅ |
| Dashboard + Activity | ✅ |
| Finance API | ✅ |
| Settings + Seed | ✅ |
| **Frontend** | ⏳ не начат |

## Что дальше

Frontend по плану `docs/superpowers/plans/2026-06-27-tutordesk-frontend.md`:

- F-01: Vite scaffold + Tailwind + React Router + TanStack Query + axios  
- F-02: Auth screen  
- F-03: Layout shell (sidebar)  
- F-04: Students list  
- F-05: Student profile  
- F-06: Schedule (weekly grid)  
- F-07: Homework page  
- F-08: Finance page  
- F-09: Settings page  
