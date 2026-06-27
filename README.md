# TutorDesk

Dashboard for tutors: students, sessions, homework, payments.

## Stack

**Backend** — Node.js 20 + Express 4 + Prisma 5 + PostgreSQL 16  
**Frontend** — React 18 + Vite 5 + TanStack Query 5 + Tailwind CSS 3  
**Auth** — JWT, 7d expiry, single-tutor app

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally

### Database setup
```bash
psql -U postgres -c "CREATE ROLE tutor WITH LOGIN PASSWORD 'tutor' CREATEDB;"
psql -U postgres -c "CREATE DATABASE tutordesk OWNER tutor;"
psql -U postgres -c "CREATE DATABASE tutordesk_test OWNER tutor;"
```

### Backend
```bash
cd backend
npm install
npm run db:migrate          # apply migrations to tutordesk
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk_test npx prisma migrate deploy
npm run dev                 # starts on port 3001
```

### Tests
```bash
cd backend
npm test                    # all tests, runs against tutordesk_test
```

### Docker (optional)
```bash
docker-compose up
```
Backend on `localhost:3001`, frontend on `localhost:5173`.

## Project Structure

```
tutor/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── prisma.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # Bearer JWT verify
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js          # POST /api/auth/login
│   │   │   ├── students.js      # CRUD + auto-initials
│   │   │   ├── sessions.js      # CRUD + ?week filter
│   │   │   ├── homework.js      # PATCH status/grade
│   │   │   ├── topics.js        # CRUD per studentSubject
│   │   │   ├── notes.js         # CRUD per student
│   │   │   └── payments.js      # CRUD + ?studentId filter
│   │   └── services/
│   │       ├── students.js      # generateInitials()
│   │       └── homework.js      # isOverdue()
│   └── tests/
├── frontend/                    # not started yet
├── docs/superpowers/
│   ├── specs/2026-06-27-tutordesk-design.md
│   └── plans/
│       ├── 2026-06-27-tutordesk-backend.md
│       └── 2026-06-27-tutordesk-frontend.md
└── docker-compose.yml
```

## API Routes

All routes except `POST /api/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → `{ token, tutor }` |
| GET | `/api/students` | list with subjects + last payment |
| POST | `/api/students` | `{ name, phone, subject, level, initials?, color?, rate? }` |
| GET | `/api/students/:id` | full profile: subjects, sessions, homework, payments, notes |
| PATCH | `/api/students/:id` | update name/phone/initials/color/parentContact |
| DELETE | `/api/students/:id` | cascade delete |
| GET | `/api/sessions?week=YYYY-MM-DD` | sessions for week (or all if no param) |
| POST | `/api/sessions` | `{ studentSubjectId, startTime, durationMin }` |
| PATCH | `/api/sessions/:id` | update status/startTime/durationMin |
| DELETE | `/api/sessions/:id` | |
| PATCH | `/api/homework/:id` | update status/grade |
| POST | `/api/topics` | `{ studentSubjectId, title, sortOrder }` |
| PATCH | `/api/topics/:id` | toggle completed / update title |
| DELETE | `/api/topics/:id` | |
| POST | `/api/notes` | `{ studentId, content }` |
| PATCH | `/api/notes/:id` | update content |
| DELETE | `/api/notes/:id` | |
| GET | `/api/payments?studentId=` | all payments, optional student filter |
| POST | `/api/payments` | `{ studentId, amount, method, dueDate, status? }` |
| PATCH | `/api/payments/:id` | update status/method/amount/dueDate |
| DELETE | `/api/payments/:id` | |

## Key Design Decisions

- **Single tutor**: no `tutor_id` FK on domain tables; JWT identifies the tutor
- **Homework OVERDUE**: computed at read time (`status=ASSIGNED` + session older than 7 days), not stored
- **Activity feed**: UNION of payments + homework + sessions — no separate `activity_log` table
- **initials**: auto-generated from name on POST, tutor can override via PATCH
- **rate_per_hour**: on `StudentSubject` (nullable, falls back to `Tutor.ratePerHour`)

## Env Files

`backend/.env` — dev DB, port 3001  
`backend/.env.test` — test DB, port 3002  
(not committed — see format in README)

```
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk
JWT_SECRET=your_secret_here
PORT=3001
```
