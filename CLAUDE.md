# TutorDesk — Agent Context

## Project
**TutorDesk** — all-in-one private dashboard for an independent tutor (students, sessions, homework, payments, finances)
React 18 + Vite 5 + Tailwind CSS 3 · Node.js + Express + Prisma + PostgreSQL 16

```
cd backend && npm run dev     # API on :3001
cd frontend && npm run dev    # SPA on :5173
```

## Design Context
- **PRODUCT.md** — strategic register (product + landing), users, brand personality, principles, accessibility
- **DESIGN.md** — visual system: color tokens, typography, elevation, components, do's & don'ts
- **`.impeccable/design.json`** — machine-readable design sidecar (tonal ramps, shadow tokens, component snippets)

Before generating any new UI: read PRODUCT.md and DESIGN.md first. North Star: **"The Tutor's Practice"** — polished professional tool, not a SaaS marketing page or admin panel.

## Stack Notes
- All UI text in Russian
- Desktop-only MVP (no mobile breakpoints)
- JWT stored in localStorage under key `token`
- Single tutor — no multi-tenancy

## Запреты
- Не трогать `backend/prisma/schema.prisma` без явного запроса
- Не добавлять мобильные breakpoints (MVP — только desktop)
- Не менять semantic badge colors (green/yellow/red/blue/gray — контракт)
