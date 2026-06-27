# Session Handoff — TutorDesk

**Last updated:** 2026-06-27  
**Repo:** https://github.com/LTYcsv/tutor_dash

## Current State

Backend ~70% done. Frontend not started.

All backend tests pass: 33 tests across 5 suites.

```
tests/health.test.js            1 test   ✓
tests/auth.test.js              5 tests  ✓
tests/students.test.js          7 tests  ✓
tests/sessions.test.js          8 tests  ✓
tests/homeworkTopicsNotes.test.js 10 tests ✓
tests/payments.test.js          8 tests  ✓
```

## What's Done (backend)

- B-01 ✓ Scaffold: Express + Prisma + PostgreSQL schema + migrations
- B-02 ✓ Auth: POST /api/auth/login + Bearer JWT middleware
- B-03 ✓ Students CRUD + auto-initials + GET /:id full profile
- B-05 ✓ Sessions CRUD + ?week filter
- B-06 ✓ Homework PATCH, Topics CRUD, Notes CRUD
- B-07 ✓ Payments CRUD + ?studentId filter

## What's Left (backend)

### B-08: Activity Service + Dashboard API
`GET /api/dashboard` — returns:
```json
{
  "todaySessions": [...],
  "weekSessions": [...],
  "recentActivity": [...],
  "stats": { "studentsCount": 5, "monthEarnings": 45000, "pendingPayments": 2 }
}
```
`recentActivity` = UNION of last 10 records from payments + homework status changes + sessions.
Use raw SQL or Prisma `$queryRaw` for the UNION.

### B-09: Finance API
`GET /api/finance?month=YYYY-MM` — returns:
```json
{
  "payments": [...],
  "total": 45000,
  "byMethod": { "CARD": 30000, "CASH": 15000 },
  "pending": 3000
}
```

### B-10: Settings API + Seed Script
`GET /api/settings` → tutor profile  
`PATCH /api/settings` → update name/email/ratePerHour/timezone  
`PATCH /api/settings/password` → change password (bcrypt)  
Seed script: `npm run db:seed` creates 1 tutor + 3 students with data.

## What's Left (frontend)

Plan at `docs/superpowers/plans/2026-06-27-tutordesk-frontend.md`

F-01: Vite scaffold + Tailwind + React Router + TanStack Query + axios  
F-02: Auth screen (login page, token storage)  
F-03: Layout shell (sidebar nav)  
F-04: Students list page  
F-05: Student profile page  
F-06: Schedule page (weekly calendar)  
F-07: Homework page  
F-08: Finance page  
F-09: Settings page  

## Key Architecture Facts

- **Working dir:** `/Users/ashot17/Desktop/tutor/`
- **Backend port:** 3001 (dev), 3002 (test)
- **DB:** `tutordesk` (dev), `tutordesk_test` (test)
- **DB user:** `tutor / tutor` (local only)
- **Run tests:** `cd backend && npm test`
- **Run dev:** `cd backend && npm run dev`
- Single-tutor app — no tutor_id on domain tables
- Homework OVERDUE = computed, not stored (`services/homework.js:isOverdue`)
- Activity feed = UNION query, no activity_log table
- `sessions.studentSubjectId → StudentSubject` (not student directly)
- `homework.sessionId → Session` (student derived via chain)
- `payments.studentId → Student`

## Spec + Plan Files

- Spec: `docs/superpowers/specs/2026-06-27-tutordesk-design.md`
- Backend plan: `docs/superpowers/plans/2026-06-27-tutordesk-backend.md`
- Frontend plan: `docs/superpowers/plans/2026-06-27-tutordesk-frontend.md`

## Next Command

```bash
cd /Users/ashot17/Desktop/tutor/backend && npm test
```
Should show 33 passing tests. Then continue with B-08.
