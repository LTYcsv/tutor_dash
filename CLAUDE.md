# TutorDesk — Agent Context

## Project
**TutorDesk** — all-in-one private dashboard for an independent tutor (students, sessions, homework, payments, finances)
React 18 + Vite 5 + Tailwind CSS 3 · Node.js + Express + Prisma + PostgreSQL 16
Infrastructure: PostgreSQL 16 (Docker) · JWT auth (7d) · TanStack Query 5

```bash
cd backend && npm run dev          # API on :3001
cd frontend && npm run dev         # SPA on :5173
docker-compose up                  # db + backend + frontend
cd backend && npm test             # jest --runInBand
cd backend && npm run db:seed      # tutor@tutordesk.ru / password123
cd backend && npm run db:migrate   # prisma migrate dev
```

## Key Docs
- **docs/session-handoff.md** — текущее состояние, что сделано/осталось, next steps
- **docs/techspec.md** — полный API reference, DB schema, бизнес-правила
- **docs/superpowers/plans/** — планы backend + frontend

## Design Context
- **`./PRODUCT.md`** — strategic register (product + landing), users, brand personality, principles, accessibility
- **`./DESIGN.md`** — visual system: color tokens, typography, elevation, components, do's & don'ts

Before generating any new UI: read PRODUCT.md and DESIGN.md first. North Star: **"The Tutor's Practice"** — polished professional tool, not a SaaS marketing page or admin panel.

## Stack Notes
- All UI text in Russian
- Desktop-only MVP (no mobile breakpoints)
- JWT stored in localStorage under key `token`
- Single tutor — no multi-tenancy, no `tutorId` on domain tables
- `NODE_ENV=test` → reads `.env.test` → DB `tutordesk_test` (dev: `tutordesk`)

## Architecture Gotchas
- `sessions → StudentSubject → Student` (не прямо к Student)
- `homework → Session → StudentSubject → Student` (3-hop chain)
- Homework OVERDUE = **computed** (`services/homework.js:isOverdue`), не хранится в DB
- Activity feed = UNION query (`services/activity.js`), нет `activity_log` таблицы
- `studentSubject.ratePerHour ?? tutor.ratePerHour` — fallback **только на фронтенде** (сознательно: API хранит оба значения как есть, display-only concern; не «чинить» на бэкенде)

## Obsidian Knowledge Vault
**Путь:** `/Users/ashot17/Library/Mobile Documents/iCloud~md~obsidian/Documents/tutordesk`
_(локальный путь, работает только на mac репетитора с iCloud; CLAUDE.md не коммитить в репо или добавить в .gitignore)_

### При старте сессии — прочитать:
- `00-home/index.md` — состояние проекта, текущий фокус
- `00-home/приоритеты.md` — что делаем сейчас
- `sessions/` — последняя сессия (самый свежий файл)

### При завершении сессии — записать:
- Новый файл `sessions/YYYY-MM-DD.md` — что сделано, что осталось, где остановились
- `knowledge/decisions/` — архитектурные решения (почему выбрали X)
- `knowledge/patterns/` — паттерны, открытые в коде
- `knowledge/debugging/` — баги и как чинили
- `00-home/приоритеты.md` — обновить текущий фокус

### Структура vault
`00-home/` · `sessions/` · `knowledge/decisions/` · `knowledge/patterns/` · `knowledge/debugging/`

## Запреты
- Не трогать `backend/prisma/schema.prisma` без явного запроса
- Не добавлять мобильные breakpoints (MVP — только desktop)
- Не менять semantic badge colors (green/yellow/red/blue/gray — контракт)
