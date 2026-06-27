# TutorDesk — Design Spec
**Date:** 2026-06-27  
**Stack:** Node.js + Express · PostgreSQL + Prisma · React + Vite  
**Auth:** JWT (single tutor)

---

## 1. Architecture

Monorepo, два каталога:

```
tutor/
  backend/    # Express REST API
  frontend/   # React + Vite SPA
  docker-compose.yml
```

`docker compose up` поднимает PostgreSQL + Express + Vite dev server.

Фронтенд общается с бэкендом только через REST API (`/api/*`).  
Вся бизнес-логика — на бэкенде. Фронтенд только рендерит и отправляет запросы.

---

## 2. База данных

### Схема

```
tutors           (id, name, email, password_hash, rate_per_hour, timezone, updated_at)

students         (id, name, initials?, color, phone, parent_contact, enrolled_since, created_at)
                 -- initials: nullable, auto-generated from name on create, tutor can override

student_subjects (id, student_id → students, subject, level, rate_per_hour?)
                         ↓
topics           (id, student_subject_id → student_subjects, title, completed, sort_order)

sessions         (id, student_subject_id → student_subjects, start_time, duration_min,
                  status: CONFIRMED | UNCONFIRMED | COMPLETED | CANCELLED)
                         ↓
homework         (id, session_id → sessions, title,
                  status: ASSIGNED | SUBMITTED | CHECKED,
                  grade?, updated_at)
                 -- OVERDUE не хранится: вычисляется в сервисе как
                 -- status=ASSIGNED AND session.start_time < NOW() - 7 days

payments         (id, student_id → students, amount, method: CARD | CASH | TRANSFER,
                  status: PAID | PENDING | OVERDUE, paid_at?, due_date)

notes            (id, student_id → students, content, created_at, updated_at)
```

### Ключевые решения

- **Один репетитор** — `tutor_id` не проходит через все таблицы. JWT идентифицирует репетитора.
- **rate_per_hour на student_subjects** (nullable) — переопределяет дефолтную ставку из `tutors`. Логика: `student_subjects.rate_per_hour ?? tutor.rate_per_hour`.
- **Payments per student**, не per session — репетиторы берут оплату за блоки/месяц. `due_date < now() AND status != PAID` = просрочка.
- **Activity feed без отдельной таблицы** — UNION из payments + homework + sessions, вынесен в `backend/src/services/activity.js`.

---

## 3. REST API

Все маршруты под `/api`. Все (кроме login) требуют `Authorization: Bearer <token>`.

### Auth
```
POST /api/auth/login          { email, password } → { token, tutor }
```

### Dashboard
```
GET  /api/dashboard           → { metrics, todaySessions, recentActivity }
```
`metrics`: всего учеников, занятий в месяце, доход за месяц, кол-во просроченных платежей.  
`todaySessions`: sessions WHERE date(start_time) = today, JOIN student_subjects → students.  
`recentActivity`: UNION из payments + homework + sessions за 7 дней, отсортировано по времени.

### Students
```
GET    /api/students                    → список с агрегатами (next session, hw status, pay status)
POST   /api/students                    { name, initials, color, phone, parent_contact, subject, level, rate? }
GET    /api/students/:id                → полный профиль + subjects + topics + sessions + payments + homework + notes
PATCH  /api/students/:id                { name?, phone?, ... }
DELETE /api/students/:id
```

### Sessions (Расписание)
```
GET    /api/sessions?week=YYYY-MM-DD   → занятия за неделю (Пн–Вс)
POST   /api/sessions                   { student_subject_id, start_time, duration_min, status }
PATCH  /api/sessions/:id               { status?, start_time?, duration_min? }
DELETE /api/sessions/:id
```

### Finance
```
GET  /api/finance                      → { metrics, chartData[6mo], debts, paymentLog }
```
`chartData`: доход по месяцам за 6 месяцев, агрегируется из payments WHERE status=PAID.  
`debts`: students с payments WHERE status=OVERDUE, сгруппировано по student, суммировано.

### Payments
```
POST   /api/payments                   { student_id, amount, method, due_date }
PATCH  /api/payments/:id               { status?, paid_at?, method? }
POST   /api/payments/:id/remind        → toast-событие (в MVP: просто 200 OK, логируется в activity)
```

### Homework
```
PATCH  /api/homework/:id               { status?, grade? }
```

### Topics
```
PATCH  /api/topics/:id                 { completed: bool }
POST   /api/topics                     { student_subject_id, title, sort_order }
DELETE /api/topics/:id
```

### Notes
```
POST   /api/notes                      { student_id, content }
PATCH  /api/notes/:id                  { content }
DELETE /api/notes/:id
```

### Settings
```
GET    /api/settings                   → tutor profile
PATCH  /api/settings                   { name?, email?, rate_per_hour?, timezone? }
```

---

## 4. Backend Structure

```
backend/
  src/
    routes/         # auth.js, dashboard.js, students.js, sessions.js,
                    # finance.js, payments.js, homework.js, topics.js,
                    # notes.js, settings.js
    services/       # activity.js (UNION-запрос ленты событий)
                    # finance.js (агрегаты, chart data, debts)
    middleware/     # auth.js (JWT verify)
    prisma/         # schema.prisma
    app.js          # Express setup, маршруты, error handler
    server.js       # listen
  .env              # DATABASE_URL, JWT_SECRET, PORT
```

---

## 5. Frontend Structure

```
frontend/src/
  api/              # axios instance + функции-обёртки по доменам
                    # auth.js, students.js, sessions.js, finance.js, ...
  components/       # Badge, Avatar, Modal, Toast, Table, Button
  pages/            # Dashboard, Students, Schedule, Finance, Settings
  hooks/            # useStudents, useSessions, useFinance, useAuth
  context/          # AuthContext.jsx (JWT, login/logout)
  App.jsx           # Router + layout
  main.jsx
```

Роутинг: React Router v6. Защищённые маршруты через `<PrivateRoute>`.  
Состояние: локальное (useState/useReducer) + React Query для кэширования API-ответов.  
Стили: Tailwind CSS v3.

---

## 6. Docker Compose

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD }
    volumes: [pgdata:/var/lib/postgresql/data]
  backend:
    build: ./backend
    depends_on: [db]
    env_file: ./backend/.env
    ports: ["3001:3001"]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    environment: { VITE_API_URL: http://localhost:3001 }

volumes:
  pgdata:
```

---

## 7. Scope MVP

**В MVP:**
- Auth (login + JWT)
- CRUD учеников + карточка ученика (все вкладки)
- Расписание (недельная сетка, добавить/редактировать занятие)
- Финансовый экран (метрики, chart, долги, журнал платежей)
- Дашборд (метрики, занятия сегодня, лента активности)
- Настройки профиля

**Вне MVP (не делаем сейчас):**
- Email/SMS уведомления (кнопка "Напомнить" → 200 OK без реальной отправки)
- Экспорт CSV
- Мобильная адаптация (только desktop)
- Мультирепетиторность
