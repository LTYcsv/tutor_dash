<div align="center">

# TutorDesk

[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose)
[![Tests](https://img.shields.io/badge/56_тестов-passing-22C55E?style=flat-square&logo=jest&logoColor=white)]()
[![Status](https://img.shields.io/badge/статус-в_разработке-F59E0B?style=flat-square)]()

</div>

---

Учебный full-stack проект — личный дашборд для независимого репетитора. Ученики с профилями, расписание занятий, домашние задания, платежи и финансовая аналитика в одном месте. Стек: React + Express + PostgreSQL, деплой через Docker Compose.

---

## Интерфейс

<div align="center">

<table>
<tr>
<td align="center"><strong>Дашборд</strong></td>
<td align="center"><strong>Ученики</strong></td>
<td align="center"><strong>Расписание</strong></td>
</tr>
<tr>
<td><img src="screenshots/dashboard.png" alt="Дашборд — метрики, занятия, лента активности" width="360"></td>
<td><img src="screenshots/students.png" alt="Ученики — таблица с предметами и статусами" width="360"></td>
<td><img src="screenshots/schedule.png" alt="Расписание — недельный календарь" width="360"></td>
</tr>
<tr>
<td align="center"><strong>Домашние задания</strong></td>
<td align="center"><strong>Финансы</strong></td>
<td></td>
</tr>
<tr>
<td><img src="screenshots/homework.png" alt="Домашние задания — фильтры по статусу, оценки" width="360"></td>
<td><img src="screenshots/finance.png" alt="Финансы — доход, задолженности, график" width="360"></td>
<td></td>
</tr>
</table>

</div>

---

## Возможности

<table>
<tr>
<td width="50%" valign="top">

**👨‍🎓 Ученики**
- Профиль с предметами, уровнями и ставкой
- Автогенерация инициалов из имени
- Цветовые метки для быстрой идентификации
- Контакт родителя, заметки

</td>
<td width="50%" valign="top">

**📅 Расписание**
- Недельный вид с фильтром по дате
- Статусы: подтверждено / не подтверждено / завершено / отменено
- Привязка к предмету → автоматическая связь с учеником

</td>
</tr>
<tr>
<td width="50%" valign="top">

**📝 Домашние задания**
- Статусы: задано / сдано / проверено
- Оценка от 1 до 10
- Просроченные задания вычисляются автоматически (7 дней после урока) — без хранения в БД

</td>
<td width="50%" valign="top">

**💳 Платежи и финансы**
- Оплата по ученику (блочная / месячная)
- Методы: карта / наличные / перевод
- Финансовый отчёт за любой месяц с разбивкой по методам

</td>
</tr>
<tr>
<td width="50%" valign="top">

**📊 Дашборд**
- Занятия на сегодня и на неделю
- Лента активности: последние платежи, домашки, занятия
- Статистика: количество учеников, доход за месяц, ожидающие платежи

</td>
<td width="50%" valign="top">

**🔐 Авторизация**
- JWT-аутентификация, 7 дней
- Single-tutor: нет мультиарендности
- Единый профиль с базовой ставкой и часовым поясом

</td>
</tr>
</table>

---

## Стек

<div align="center">

<table>
<tr>
<th align="center">Frontend</th>
<th align="center">Backend</th>
<th align="center">Инфраструктура</th>
</tr>
<tr>
<td align="center" valign="top">

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
<br>
![React Router](https://img.shields.io/badge/React_Router_6-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query_5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![axios](https://img.shields.io/badge/axios-5A29E4?style=flat-square&logo=axios&logoColor=white)

</td>
<td align="center" valign="top">

![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white)
<br>
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Jest](https://img.shields.io/badge/Jest_29-C21325?style=flat-square&logo=jest&logoColor=white)

</td>
<td align="center" valign="top">

![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
<br>
![Supertest](https://img.shields.io/badge/Supertest-56_тестов-22C55E?style=flat-square)
<br>
![Migrations](https://img.shields.io/badge/Prisma-2_миграции-2D3748?style=flat-square&logo=prisma&logoColor=white)

</td>
</tr>
</table>

</div>

---

## Архитектура

```mermaid
graph TB
    subgraph Client["🌐 Клиент"]
        F["React 18 SPA\nVite · TanStack Query · Tailwind"]
    end

    subgraph Docker["🐳 Docker Compose"]
        direction TB
        B["Express :3001\nREST API + JWT"]
        DB["PostgreSQL :5432"]
        B -->|"Prisma ORM"| DB
    end

    F <-->|"axios + Bearer JWT"| B
```

Два сервиса + БД. Frontend проксирует `/api` на backend через Vite dev server. Все маршруты (кроме `/api/auth/login`) защищены JWT-middleware.

```
backend/src/
├── middleware/    # auth.js (JWT verify) · errorHandler.js (P2025→404)
├── routes/        # auth · students · sessions · homework · topics · notes · payments · dashboard · finance · settings
└── services/      # generateInitials · isOverdue · getRecentActivity (UNION)

frontend/src/
├── api/           # axios client + domain wrappers
├── components/    # Badge · Avatar · Button · Layout · Modal · StudentModal · CreateSessionModal
├── pages/         # Login · Dashboard · Students · Schedule · Homework · Finance · Settings
└── context/       # AuthContext (JWT) · ToastContext
```

---

## Технические решения

| Задача | Решение | Зачем |
|---|---|---|
| Single-tutor | Нет `tutorId` на доменных таблицах | JWT однозначно идентифицирует репетитора |
| Homework OVERDUE | Вычисляется в `services/homework.js:isOverdue()` — не хранится | Нет stale data, нет фоновых job'ов |
| Activity feed | UNION из payments + sessions + homework в `services/activity.js` | Нет отдельной таблицы `activity_log` для поддержки |
| Связи сессий | `Session → StudentSubject → Student` (не напрямую) | Одно занятие = конкретный предмет, не ученик в целом |
| Ставка за час | `StudentSubject.ratePerHour` nullable, fallback → `Tutor.ratePerHour` | Индивидуальная ставка по предмету без обязательного заполнения |
| Платежи | `Payment → Student`, не к `Session` | Оплата блочная/месячная, не поурочная |
| Тестирование | `--runInBand`, `beforeEach` чистит БД через TRUNCATE | Одна тестовая БД, нет гонок между тестами |

---

## Масштаб проекта

<div align="center">

| 56 тестов | 9 тест-суитов | 7 страниц | 20 API-эндпоинтов | 8 Prisma-моделей | 4 enum'а |
|:---:|:---:|:---:|:---:|:---:|:---:|

</div>

---

<details>
<summary><strong>Запуск локально</strong></summary>

**Через Docker (рекомендуется)**

```bash
git clone https://github.com/LTYcsv/tutor_dash.git
cd tutor_dash
docker-compose up
# → API: http://localhost:3001
# → SPA: http://localhost:5173
```

**Вручную**

```bash
# 1. PostgreSQL — создать роль и базы
psql -U $(whoami) -c "CREATE ROLE tutor WITH LOGIN PASSWORD 'tutor' CREATEDB;"
psql -U tutor    -c "CREATE DATABASE tutordesk;"
psql -U tutor    -c "CREATE DATABASE tutordesk_test;"

# 2. Backend
cd backend
npm install
npm run db:migrate        # применить миграции
npm run db:seed           # создать тестовые данные
npm run dev               # :3001

# 3. Frontend
cd frontend
npm install
npm run dev               # :5173
```

```env
# backend/.env
DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutordesk
JWT_SECRET=your_secret_here
PORT=3001
```

После `npm run db:seed` — логин: `tutor@tutordesk.ru / password123`

</details>

<details>
<summary><strong>Тесты</strong></summary>

```bash
cd backend
npm test                          # все 56 тестов
npm test -- tests/auth.test.js    # один файл
```

`NODE_ENV=test` → читает `backend/.env.test` → DB `tutordesk_test`

</details>

---

## Лицензия

© 2026 LTYcsv. Все права защищены.

Исходный код опубликован в ознакомительных целях. Использование, копирование, распространение или развёртывание без письменного разрешения автора запрещено.
