# TutorDesk Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React + Vite SPA for TutorDesk — pure presentation layer, all data from the backend REST API.

**Architecture:** React Router v6 for routing, TanStack Query v5 for data fetching/caching, axios with JWT interceptor. Tailwind CSS for styling (matching existing tutordesk.html design tokens). No local business logic — everything computed server-side.

**Tech Stack:** React 18 · Vite 5 · React Router 6 · TanStack Query 5 · axios · Tailwind CSS 3

## Global Constraints

- Node.js >= 20
- API base URL: `VITE_API_URL` env var (default `/api` — proxied by Vite dev server to `localhost:3001`)
- JWT stored in `localStorage` under key `token`; tutor profile under key `tutor`
- Tailwind color palette mirrors spec: indigo `#4F46E5`, dark `#4338CA`, light `#EEF2FF`
- Components render data as-is from API; no client-side aggregation
- Decimal amounts from API are strings — parse with `Number()` before display
- All text in Russian (matches existing HTML)
- No test framework required for frontend in MVP — visual verification via dev server

---

### Task 1: Frontend Scaffold (Vite + React + Tailwind + axios + Router)

**Files:**
- Create: `frontend/` (Vite project scaffolded)
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/index.css`
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/Dockerfile`

**Interfaces:**
- Produces: `api/client.js` — axios instance with JWT interceptor and 401 redirect
- Produces: dev server at `http://localhost:5173` proxying `/api` to `http://localhost:3001`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/ashot17/Desktop/tutor
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install axios react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#EEF2FF'
        }
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 4: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --indigo: #4F46E5;
  --indigo-dark: #4338CA;
  --indigo-light: #EEF2FF;
  --bg: #F8FAFC;
  --text: #1E293B;
  --text-muted: #64748B;
  --border: #E2E8F0;
  --green: #16A34A;
  --green-bg: #DCFCE7;
  --yellow: #CA8A04;
  --yellow-bg: #FEF9C3;
  --red: #DC2626;
  --red-bg: #FEE2E2;
  --blue: #2563EB;
  --blue-bg: #DBEAFE;
}

* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
```

- [ ] **Step 5: Configure `frontend/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

- [ ] **Step 6: Create `frontend/src/api/client.js`**

```js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tutor');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
```

- [ ] **Step 7: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

- [ ] **Step 8: Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:5173/` in terminal, browser shows Vite default page.

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold Vite + React + Tailwind + axios"
```

---

### Task 2: Auth — Login Page + AuthContext + PrivateRoute

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`

**Interfaces:**
- Consumes: `api/client.js`
- Produces: `useAuth()` hook → `{ tutor, login(email, password), logout() }`
- Produces: `<PrivateRoute>` — redirects to `/login` if not authenticated
- Produces: `POST /api/auth/login` called from `login()`

- [ ] **Step 1: Create `frontend/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [tutor, setTutor] = useState(() => {
    try {
      const t = localStorage.getItem('tutor');
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await client.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('tutor', JSON.stringify(data.tutor));
    setTutor(data.tutor);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tutor');
    setTutor(null);
  }

  return (
    <AuthContext.Provider value={{ tutor, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Create `frontend/src/pages/Login.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm border border-slate-200">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-lg">T</div>
          <span className="text-xl font-bold">Tutor<span className="text-[#4F46E5]">Desk</span></span>
        </div>
        <h1 className="text-lg font-semibold text-slate-800 mb-6 text-center">Вход в аккаунт</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="anna@tutordesk.ru"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#4F46E5] focus:bg-white"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#4F46E5] focus:bg-white"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Placeholder pages — replaced in later tasks
const Dashboard = () => <div className="p-8 text-slate-500">Дашборд — скоро</div>;
const Students = () => <div className="p-8 text-slate-500">Ученики — скоро</div>;
const Schedule = () => <div className="p-8 text-slate-500">Расписание — скоро</div>;
const Finance = () => <div className="p-8 text-slate-500">Финансы — скоро</div>;
const Settings = () => <div className="p-8 text-slate-500">Настройки — скоро</div>;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});

function PrivateRoute({ children }) {
  const { tutor } = useAuth();
  return tutor ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/students" element={<PrivateRoute><Students /></PrivateRoute>} />
      <Route path="/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
      <Route path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Update `frontend/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Verify in browser**

Start backend: `cd backend && npm run dev`
Start frontend: `cd frontend && npm run dev`

Visit `http://localhost:5173` — should redirect to `/login`. Enter `anna@tutordesk.ru` / `tutordesk123` (from seed), should redirect to `/` showing "Дашборд — скоро".

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): auth login page, AuthContext, PrivateRoute"
```

---

### Task 3: Layout + Navigation

**Files:**
- Create: `frontend/src/components/Layout.jsx`
- Modify: `frontend/src/App.jsx` (wrap pages in Layout)

**Interfaces:**
- Consumes: `context/AuthContext.jsx`
- Produces: `<Layout>` — sticky TopNav + `<Outlet>` for page content
- Produces: active NavLink highlighting per route

- [ ] **Step 1: Create `frontend/src/components/Layout.jsx`**

```jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/students', label: 'Ученики' },
  { to: '/schedule', label: 'Расписание' },
  { to: '/finance', label: 'Финансы' },
  { to: '/settings', label: 'Настройки' }
];

export default function Layout() {
  const { tutor, logout } = useAuth();
  const navigate = useNavigate();

  const initials = tutor?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('') || '??';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-[#E2E8F0] h-[60px] flex items-center px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5 text-[18px] font-bold mr-10 whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center font-extrabold text-base">
            T
          </div>
          <span>Tutor<span className="text-[#4F46E5]">Desk</span></span>
        </div>

        <div className="flex gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="text-sm text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            Выйти
          </button>
          <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-semibold text-[13px]">
            {initials}
          </div>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-6 py-7 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/App.jsx` — wrap protected routes in Layout**

Replace `AppRoutes` function:
```jsx
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

Add `import Layout from './components/Layout';` at top of App.jsx.

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:5173` after login. Should see sticky nav with all 5 items, active item highlighted indigo, logout button functional.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Layout.jsx frontend/src/App.jsx
git commit -m "feat(frontend): layout with sticky nav + active route highlighting"
```

---

### Task 4: Shared Components — Badge, Avatar, Button, Modal, Toast

**Files:**
- Create: `frontend/src/components/Badge.jsx`
- Create: `frontend/src/components/Avatar.jsx`
- Create: `frontend/src/components/Button.jsx`
- Create: `frontend/src/components/Modal.jsx`
- Create: `frontend/src/context/ToastContext.jsx`

**Interfaces:**
- Produces: `<Badge variant="green|yellow|red|blue|gray">{text}</Badge>`
- Produces: `<Avatar initials color size="sm|md|lg" />`
- Produces: `<Button variant="primary|ghost" size="sm|md">{text}</Button>`
- Produces: `<Modal open onClose title>{children}</Modal>`
- Produces: `useToast()` → `{ showToast(title, msg, icon?) }`

- [ ] **Step 1: Create `frontend/src/components/Badge.jsx`**

```jsx
const VARIANTS = {
  green:  'bg-[#DCFCE7] text-[#16A34A]',
  yellow: 'bg-[#FEF9C3] text-[#CA8A04]',
  red:    'bg-[#FEE2E2] text-[#DC2626]',
  blue:   'bg-[#DBEAFE] text-[#2563EB]',
  gray:   'bg-[#F1F5F9] text-[#64748B]'
};

export default function Badge({ variant = 'gray', children, onClick }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${VARIANTS[variant]} ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/Avatar.jsx`**

```jsx
const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-[38px] h-[38px] text-[13px]',
  lg: 'w-16 h-16 text-[22px]'
};

export default function Avatar({ initials = '?', color = '#4F46E5', size = 'md' }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${SIZES[size]}`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/Button.jsx`**

```jsx
const VARIANTS = {
  primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA]',
  ghost:   'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
};
const SIZES = {
  md: 'px-4 py-[9px] text-sm',
  sm: 'px-3 py-1.5 text-[13px]'
};

export default function Button({ variant = 'primary', size = 'md', children, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/Modal.jsx`**

```jsx
import { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidth = '720px' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.45)] flex items-start justify-center z-[100] px-5 py-10 overflow-y-auto backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full shadow-2xl animate-[pop_.25s_ease]"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
```

Add animation keyframe to `index.css`:
```css
@keyframes pop {
  from { transform: scale(0.96) translateY(10px); opacity: 0; }
  to   { transform: none; opacity: 1; }
}
```

- [ ] **Step 5: Create `frontend/src/context/ToastContext.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, msg, icon = '✓') => {
    const id = Date.now();
    setToasts(t => [...t, { id, title, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5">
        {toasts.map(t => (
          <div key={t.id} className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#16A34A] rounded-xl px-[18px] py-3.5 shadow-xl flex items-center gap-3 min-w-[300px] max-w-[400px] animate-[slideIn_.3s_ease]">
            <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center text-base flex-shrink-0">
              {t.icon}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1E293B]">{t.title}</div>
              <div className="text-[13px] text-[#64748B]">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
```

Add to `index.css`:
```css
@keyframes slideIn {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: none; opacity: 1; }
}
```

- [ ] **Step 6: Wrap app with ToastProvider in `frontend/src/App.jsx`**

```jsx
import { ToastProvider } from './context/ToastContext';

// In App():
return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ frontend/src/context/ToastContext.jsx frontend/src/App.jsx frontend/src/index.css
git commit -m "feat(frontend): shared components Badge, Avatar, Button, Modal, Toast"
```

---

### Task 5: Dashboard Page

**Files:**
- Create: `frontend/src/api/dashboard.js`
- Create: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/App.jsx` (replace placeholder)

**Interfaces:**
- Consumes: `GET /api/dashboard → { metrics, todaySessions, recentActivity }`
- Consumes: `Badge`, `Avatar` components
- Produces: Dashboard page with 4 metric cards + today's sessions panel + activity feed panel

- [ ] **Step 1: Create `frontend/src/api/dashboard.js`**

```js
import client from './client';

export const getDashboard = () =>
  client.get('/api/dashboard').then(r => r.data);
```

- [ ] **Step 2: Create `frontend/src/pages/Dashboard.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const PAY_STATUS = {
  PAID: ['green', 'Оплачено'],
  PENDING: ['yellow', 'Ожидает'],
  OVERDUE: ['red', 'Просрочено']
};

const SESSION_STATUS = {
  CONFIRMED: ['blue', 'Подтверждено'],
  UNCONFIRMED: ['yellow', 'Не подтверждено'],
  COMPLETED: ['green', 'Завершено'],
  CANCELLED: ['gray', 'Отменено']
};

function fmt(n) {
  return Number(n).toLocaleString('ru');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} мин. назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  return `${Math.floor(hrs / 24)} дн. назад`;
}

export default function Dashboard() {
  const { tutor } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) return <div className="text-[#64748B] p-8">Загрузка…</div>;

  const { metrics, todaySessions, recentActivity } = data;

  const METRIC_CARDS = [
    { label: 'Всего учеников', value: metrics.studentCount, icon: '👥', bg: 'bg-[#EEF2FF]', color: 'text-[#4F46E5]', trend: '', trendClass: '' },
    { label: 'Занятий в месяце', value: metrics.sessionsThisMonth, icon: '📅', bg: 'bg-[#DBEAFE]', color: 'text-[#2563EB]', trend: '', trendClass: '' },
    { label: 'Доход за месяц', value: `₽${fmt(metrics.incomeThisMonth)}`, icon: '💰', bg: 'bg-[#DCFCE7]', color: 'text-[#16A34A]', trend: '', trendClass: '' },
    { label: 'Неоплаченных счетов', value: metrics.overduePayments, icon: '⚠️', bg: 'bg-[#FEE2E2]', color: 'text-[#DC2626]', trend: '', trendClass: 'text-[#DC2626]' }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Дашборд</h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            Добро пожаловать, {tutor?.name?.split(' ')[0]}! Вот сводка на сегодня.
          </p>
        </div>
        <Button onClick={() => navigate('/schedule')}>＋ Новое занятие</Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-[18px] mb-[26px]">
        {METRIC_CARDS.map(card => (
          <div key={card.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow transition-all">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[#64748B] text-[13px] font-medium">{card.label}</div>
                <div className="text-[28px] font-bold tracking-tight mt-1">{card.value}</div>
              </div>
              <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-[18px]">
        {/* Today's sessions */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="font-bold text-[15px]">Занятия сегодня</span>
            <button
              onClick={() => navigate('/schedule')}
              className="text-[#4F46E5] text-[13px] font-semibold hover:underline"
            >
              Всё расписание →
            </button>
          </div>
          <div>
            {todaySessions.length === 0 && (
              <p className="text-[#64748B] text-sm px-5 py-4">Занятий сегодня нет</p>
            )}
            {todaySessions.map(session => {
              const s = session.studentSubject.student;
              const time = new Date(session.startTime).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
              const [statusVariant, statusLabel] = SESSION_STATUS[session.status] || ['gray', session.status];
              return (
                <div key={session.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <span className="font-bold text-sm min-w-[52px] tabular-nums">{time}</span>
                  <Avatar initials={s.initials || s.name[0]} color={s.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-[#64748B] text-[13px]">{session.studentSubject.subject} · {session.durationMin} мин</div>
                  </div>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <span className="font-bold text-[15px]">Последние события</span>
          </div>
          <div>
            {recentActivity.length === 0 && (
              <p className="text-[#64748B] text-sm px-5 py-4">Нет событий за последние 7 дней</p>
            )}
            {recentActivity.map((event, i) => (
              <div key={i} className="flex gap-3 px-5 py-3">
                <div className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center text-[15px] bg-[#DCFCE7] text-[#16A34A]">
                  {event.icon}
                </div>
                <div>
                  <div className="text-[13.5px]" dangerouslySetInnerHTML={{ __html: event.text.replace(/([А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+)/g, '<b>$1</b>') }} />
                  <div className="text-[#94A3B8] text-xs mt-0.5">{timeAgo(event.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace Dashboard placeholder in `frontend/src/App.jsx`**

```jsx
import Dashboard from './pages/Dashboard';
```

Remove `const Dashboard = () => ...` line, keep the import.

- [ ] **Step 4: Verify in browser**

Visit `http://localhost:5173`. Should see 4 metric cards (zeros if no data), today's sessions panel, activity panel.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/dashboard.js frontend/src/pages/Dashboard.jsx frontend/src/App.jsx
git commit -m "feat(frontend): dashboard page with metrics, sessions, activity"
```

---

### Task 6: Students Page + Student Modal

**Files:**
- Create: `frontend/src/api/students.js`
- Create: `frontend/src/pages/Students.jsx`
- Create: `frontend/src/components/StudentModal.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/students`, `GET /api/students/:id`
- Consumes: `PATCH /api/homework/:id`, `PATCH /api/topics/:id`, `POST /api/notes`, `PATCH /api/payments/:id/remind`
- Consumes: `Badge`, `Avatar`, `Button`, `Modal` components
- Produces: Students table with search + StudentModal with 5 tabs

- [ ] **Step 1: Create `frontend/src/api/students.js`**

```js
import client from './client';

export const getStudents = () => client.get('/api/students').then(r => r.data);
export const getStudent = id => client.get(`/api/students/${id}`).then(r => r.data);
export const createStudent = data => client.post('/api/students', data).then(r => r.data);
export const updateStudent = (id, data) => client.patch(`/api/students/${id}`, data).then(r => r.data);
export const deleteStudent = id => client.delete(`/api/students/${id}`);
export const updateHomework = (id, data) => client.patch(`/api/homework/${id}`, data).then(r => r.data);
export const toggleTopic = (id, completed) => client.patch(`/api/topics/${id}`, { completed }).then(r => r.data);
export const remindPayment = id => client.post(`/api/payments/${id}/remind`).then(r => r.data);
export const createNote = data => client.post('/api/notes', data).then(r => r.data);
export const updateNote = (id, data) => client.patch(`/api/notes/${id}`, data).then(r => r.data);
export const deleteNote = id => client.delete(`/api/notes/${id}`);
```

- [ ] **Step 2: Create `frontend/src/components/StudentModal.jsx`**

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudent, updateHomework, toggleTopic, remindPayment } from '../api/students';
import Modal from './Modal';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import { useToast } from '../context/ToastContext';

const HW_STATUS = { ASSIGNED: 'gray', SUBMITTED: 'yellow', CHECKED: 'green' };
const HW_LABEL = { ASSIGNED: 'Задано', SUBMITTED: 'Сдано', CHECKED: 'Проверено' };
const HW_NEXT = { ASSIGNED: 'SUBMITTED', SUBMITTED: 'CHECKED', CHECKED: 'ASSIGNED' };
const PAY_STATUS = { PAID: 'green', PENDING: 'yellow', OVERDUE: 'red' };
const PAY_LABEL = { PAID: 'Оплачено', PENDING: 'Ожидает', OVERDUE: 'Просрочено' };

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'progress', label: 'Прогресс' },
  { key: 'homework', label: 'Домашка' },
  { key: 'payments', label: 'Платежи' },
  { key: 'notes', label: 'Заметки' }
];

export default function StudentModal({ studentId, onClose }) {
  const [tab, setTab] = useState('overview');
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId
  });

  const hwMutation = useMutation({
    mutationFn: ({ id, status }) => updateHomework(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', studentId] })
  });

  const topicMutation = useMutation({
    mutationFn: ({ id, completed }) => toggleTopic(id, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', studentId] })
  });

  const remindMutation = useMutation({
    mutationFn: id => remindPayment(id),
    onSuccess: () => showToast('Напоминание отправлено', `Отправлено ${student?.name}`, '💬')
  });

  if (!studentId) return null;

  const sub = student?.subjects?.[0];
  const topics = sub?.topics || [];
  const sessions = student?.subjects?.flatMap(s => s.sessions) || [];
  const doneTopics = topics.filter(t => t.completed).length;
  const progressPct = topics.length ? Math.round((doneTopics / topics.length) * 100) : 0;
  const homework = sessions.flatMap(s => (s.homework || []).map(h => ({ ...h, sessionDate: s.startTime })));
  const lastPayment = student?.payments?.[0];

  return (
    <Modal open={!!studentId} onClose={onClose}>
      {isLoading || !student ? (
        <div className="p-8 text-[#64748B]">Загрузка…</div>
      ) : (
        <>
          {/* Header */}
          <div className="p-6 flex gap-4 items-center border-b border-[#E2E8F0] bg-gradient-to-br from-[#EEF2FF] to-white relative">
            <Avatar initials={student.initials || student.name[0]} color={student.color} size="lg" />
            <div>
              <div className="text-xl font-bold">{student.name}</div>
              <div className="text-[#64748B] text-[13px] mt-1 flex gap-3.5 flex-wrap">
                {sub && <span>📚 {sub.subject}</span>}
                {sub && <span>🎯 {sub.level}</span>}
                <span>📞 {student.phone}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-[34px] h-[34px] bg-white/70 hover:bg-white rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1E293B] text-lg transition-all"
            >✕</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 px-6 border-b border-[#E2E8F0]">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-[13px] text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? 'text-[#4F46E5] border-[#4F46E5]'
                    : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-6 max-h-[52vh] overflow-y-auto">

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  ['Предмет', sub?.subject],
                  ['Уровень', sub?.level],
                  ['Телефон', student.phone],
                  ['Контакт родителя', student.parentContact || '—'],
                  ['Следующее занятие', sessions[0] ? new Date(sessions[0].startTime).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'],
                  ['Статус оплаты', lastPayment
                    ? <Badge variant={PAY_STATUS[lastPayment.status]}>{PAY_LABEL[lastPayment.status]}</Badge>
                    : '—']
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#F8FAFC] rounded-xl p-3 px-3.5">
                    <div className="text-[#64748B] text-xs font-medium">{label}</div>
                    <div className="font-semibold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'progress' && (
              <div>
                <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[#64748B] text-[13px] mb-2">Пройдено {doneTopics} из {topics.length} тем</p>
                {topics.map(topic => (
                  <div key={topic.id} className="flex items-center gap-3 py-2.5 border-b border-[#E2E8F0] last:border-0">
                    <div
                      onClick={() => topicMutation.mutate({ id: topic.id, completed: !topic.completed })}
                      className={`w-[22px] h-[22px] border-2 rounded-md cursor-pointer flex items-center justify-center text-white text-[13px] flex-shrink-0 transition-all ${
                        topic.completed ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#E2E8F0]'
                      }`}
                    >
                      {topic.completed ? '✓' : ''}
                    </div>
                    <span className={topic.completed ? 'text-[#94A3B8] line-through' : ''}>{topic.title}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'homework' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>{['Дата', 'Задание', 'Статус', 'Оценка'].map(h => <th key={h} className="text-left py-2 px-2.5 text-xs text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {homework.map(hw => (
                    <tr key={hw.id} className="border-b border-[#E2E8F0] last:border-0">
                      <td className="py-2.5 px-2.5 text-[13.5px]">{new Date(hw.sessionDate).toLocaleDateString('ru')}</td>
                      <td className="py-2.5 px-2.5 text-[13.5px]">{hw.title}</td>
                      <td className="py-2.5 px-2.5">
                        <Badge
                          variant={hw.isOverdue ? 'red' : HW_STATUS[hw.status]}
                          onClick={() => hwMutation.mutate({ id: hw.id, status: HW_NEXT[hw.status] })}
                        >
                          {hw.isOverdue ? 'Просрочено' : HW_LABEL[hw.status]}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2.5">
                        {hw.grade ? (
                          <span className={`font-bold px-2 py-0.5 rounded text-[13px] ${
                            hw.grade >= 5 ? 'bg-[#DCFCE7] text-[#16A34A]' :
                            hw.grade >= 4 ? 'bg-[#DBEAFE] text-[#2563EB]' :
                            'bg-[#FEF9C3] text-[#CA8A04]'
                          }`}>{hw.grade}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'payments' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>{['Дата', 'Сумма', 'Статус'].map(h => <th key={h} className="text-left py-2 px-2.5 text-xs text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {student.payments.map(p => (
                    <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                      <td className="py-2.5 px-2.5 text-[13.5px]">{new Date(p.dueDate).toLocaleDateString('ru')}</td>
                      <td className="py-2.5 px-2.5 font-bold tabular-nums">₽{Number(p.amount).toLocaleString('ru')}</td>
                      <td className="py-2.5 px-2.5"><Badge variant={PAY_STATUS[p.status]}>{PAY_LABEL[p.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'notes' && (
              <div>
                {student.notes.map(note => (
                  <div key={note.id} className="bg-[#F8FAFC] rounded-xl p-3.5 mb-3">
                    <div className="text-[#64748B] text-xs font-semibold mb-1">{new Date(note.createdAt).toLocaleDateString('ru')}</div>
                    <div className="text-sm">{note.content}</div>
                  </div>
                ))}
                {student.notes.length === 0 && <p className="text-[#64748B] text-sm">Заметок пока нет</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <span className="text-[#64748B] text-[13px]">
              Ученик с {new Date(student.enrolledSince).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Закрыть</Button>
              {lastPayment && (
                <Button onClick={() => remindMutation.mutate(lastPayment.id)}>
                  💬 Напомнить об оплате
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
```

- [ ] **Step 3: Create `frontend/src/pages/Students.jsx`**

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../api/students';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import StudentModal from '../components/StudentModal';

const HW_STATUS = { ASSIGNED: ['gray', 'Задано'], SUBMITTED: ['yellow', 'Сдано'], CHECKED: ['green', 'Проверено'] };
const PAY_STATUS = { PAID: ['green', 'Оплачено'], PENDING: ['yellow', 'Ожидает'], OVERDUE: ['red', 'Просрочено'] };

export default function Students() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents
  });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ученики</h1>
          <p className="text-[#64748B] text-sm mt-0.5">{students.length} активных учеников</p>
        </div>
        <Button>＋ Добавить ученика</Button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] opacity-60">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени…"
              className="w-full pl-8 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5] focus:bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-[#64748B] text-sm">Загрузка…</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Ученик', 'Предмет', 'Уровень', 'Следующее занятие', 'Домашка', 'Оплата', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const sub = s.subjects?.[0];
                const lastPay = s.payments?.[0];
                const hwStatus = sub?.sessions?.[0]?.homework?.[0]?.status || 'ASSIGNED';
                const [hwVar, hwLabel] = HW_STATUS[hwStatus] || ['gray', '—'];
                const [payVar, payLabel] = lastPay ? PAY_STATUS[lastPay.status] : ['gray', '—'];
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="hover:bg-[#F8FAFC] cursor-pointer transition-colors border-b border-[#E2E8F0] last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={s.initials || s.name[0]} color={s.color} size="sm" />
                        <div>
                          <div className="font-semibold text-sm">{s.name}</div>
                          <div className="text-[#94A3B8] text-xs">{s.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">{sub?.subject || '—'}</td>
                    <td className="px-5 py-3.5"><Badge variant="gray">{sub?.level || '—'}</Badge></td>
                    <td className="px-5 py-3.5 text-sm text-[#64748B]">—</td>
                    <td className="px-5 py-3.5"><Badge variant={hwVar}>{hwLabel}</Badge></td>
                    <td className="px-5 py-3.5"><Badge variant={payVar}>{payLabel}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(s.id); }}
                          className="w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer text-[15px] text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-all flex items-center justify-center"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <StudentModal
        studentId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Replace Students placeholder in `frontend/src/App.jsx`**

```jsx
import Students from './pages/Students';
```

Remove `const Students = () => ...` line.

- [ ] **Step 5: Verify in browser**

Visit `/students`. Should see table with search, click a row opens modal with 5 tabs. Topic toggle and homework status change should update immediately via React Query invalidation.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/students.js frontend/src/pages/Students.jsx frontend/src/components/StudentModal.jsx frontend/src/App.jsx
git commit -m "feat(frontend): students page with table, search, and student modal"
```

---

### Task 7: Schedule Page (Weekly Calendar)

**Files:**
- Create: `frontend/src/api/sessions.js`
- Create: `frontend/src/pages/Schedule.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/sessions?week=YYYY-MM-DD`
- Produces: 7-column weekly grid (08:00–21:00), color-coded by subject

- [ ] **Step 1: Create `frontend/src/api/sessions.js`**

```js
import client from './client';

export const getSessions = week =>
  client.get(`/api/sessions${week ? `?week=${week}` : ''}`).then(r => r.data);

export const createSession = data =>
  client.post('/api/sessions', data).then(r => r.data);

export const updateSession = (id, data) =>
  client.patch(`/api/sessions/${id}`, data).then(r => r.data);

export const deleteSession = id =>
  client.delete(`/api/sessions/${id}`);
```

- [ ] **Step 2: Create `frontend/src/pages/Schedule.jsx`**

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/sessions';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const SUBJECT_COLORS = {
  'Математика':  { bg: '#DBEAFE', text: '#1E40AF', border: '#2563EB' },
  'Английский':  { bg: '#DCFCE7', text: '#166534', border: '#16A34A' },
  'Физика':      { bg: '#F3E8FF', text: '#6B21A8', border: '#9333EA' },
  'Химия':       { bg: '#FFEDD5', text: '#9A3412', border: '#EA580C' }
};
const DEFAULT_COLOR = { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' };

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8..21

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

export default function Schedule() {
  const [monday, setMonday] = useState(() => getMondayOf(new Date()));
  const { showToast } = useToast();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', isoDate(monday)],
    queryFn: () => getSessions(isoDate(monday))
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function sessionAt(dayIdx, hour) {
    return sessions.find(s => {
      const d = new Date(s.startTime);
      const sessionDay = (d.getDay() + 6) % 7; // Mon=0
      return sessionDay === dayIdx && d.getHours() === hour;
    });
  }

  function prevWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setMonday(d);
  }

  function nextWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setMonday(d);
  }

  const weekEnd = new Date(monday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const fmtDate = d => d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
  const subjects = [...new Set(sessions.map(s => s.studentSubject.subject))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Расписание</h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            Неделя {fmtDate(monday)} – {fmtDate(weekEnd)}
          </p>
        </div>
        <Button>＋ Добавить занятие</Button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        {/* Calendar header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={prevWeek}>‹</Button>
            <span className="font-bold text-[15px]">
              {fmtDate(monday)} – {fmtDate(weekEnd)}
            </span>
            <Button variant="ghost" size="sm" onClick={nextWeek}>›</Button>
            <Button variant="ghost" size="sm" onClick={() => setMonday(getMondayOf(new Date()))}>
              Сегодня
            </Button>
          </div>
          <div className="flex gap-4 flex-wrap">
            {subjects.map(sub => {
              const c = SUBJECT_COLORS[sub] || DEFAULT_COLOR;
              return (
                <div key={sub} className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.border }} />
                  {sub}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            {/* Corner */}
            <div className="border-r border-b border-[#E2E8F0] bg-[#FCFCFD]" />
            {/* Day headers */}
            {weekDays.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`text-center py-2.5 px-1 font-semibold text-[13px] border-r border-b border-[#E2E8F0] ${
                    isToday ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FCFCFD]'
                  }`}
                >
                  {DAYS_RU[i]} <span className="text-[#64748B] font-normal text-xs">{d.getDate()}</span>
                </div>
              );
            })}

            {/* Time rows */}
            {HOURS.map(hour => (
              <>
                <div
                  key={`t${hour}`}
                  className="text-right pr-2 py-1 text-[11px] text-[#94A3B8] border-r border-b border-[#E2E8F0] bg-[#FCFCFD] tabular-nums"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((_, dayIdx) => {
                  const session = sessionAt(dayIdx, hour);
                  if (session) {
                    const sub = session.studentSubject.subject;
                    const c = SUBJECT_COLORS[sub] || DEFAULT_COLOR;
                    const student = session.studentSubject.student;
                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        className="border-r border-b border-[#E2E8F0] min-h-[46px] relative"
                      >
                        <div
                          className="absolute inset-[3px] rounded-lg px-1.5 py-1 text-[11.5px] cursor-pointer overflow-hidden border-l-[3px] hover:scale-[1.02] hover:shadow transition-all"
                          style={{ background: c.bg, color: c.text, borderColor: c.border }}
                          onClick={() => showToast('Занятие', `${student.name} · ${sub} · ${String(hour).padStart(2,'0')}:00`, '📅')}
                        >
                          <div className="font-bold truncate">{student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.</div>
                          <div className="opacity-80 truncate">{sub}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`${dayIdx}-${hour}`}
                      className="border-r border-b border-[#E2E8F0] min-h-[46px] hover:bg-[#EEF2FF] cursor-pointer group relative"
                      onClick={() => showToast('Новое занятие', `${DAYS_RU[dayIdx]} ${String(hour).padStart(2,'0')}:00`, '＋')}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] text-[#4F46E5] font-semibold opacity-0 group-hover:opacity-100">
                        + Добавить
                      </span>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace Schedule placeholder in `frontend/src/App.jsx`**

```jsx
import Schedule from './pages/Schedule';
```

Remove `const Schedule = () => ...` line.

- [ ] **Step 4: Verify in browser**

Visit `/schedule`. Should see weekly calendar, week navigation (prev/next/today), colored session blocks from real API data.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/sessions.js frontend/src/pages/Schedule.jsx frontend/src/App.jsx
git commit -m "feat(frontend): schedule page with weekly calendar grid"
```

---

### Task 8: Finance Page

**Files:**
- Create: `frontend/src/api/finance.js`
- Create: `frontend/src/pages/Finance.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/finance → { metrics, chartData, debts, paymentLog }`
- Consumes: `POST /api/payments/:id/remind`
- Produces: Finance page with 3 metric cards, bar chart, debts table, payment log table

- [ ] **Step 1: Create `frontend/src/api/finance.js`**

```js
import client from './client';

export const getFinance = () => client.get('/api/finance').then(r => r.data);
export const markPaid = (id, method) =>
  client.patch(`/api/payments/${id}`, { status: 'PAID', method }).then(r => r.data);
export const remindPayment = id =>
  client.post(`/api/payments/${id}/remind`).then(r => r.data);
```

- [ ] **Step 2: Create `frontend/src/pages/Finance.jsx`**

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinance, remindPayment } from '../api/finance';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const PAY_STATUS = { PAID: 'green', PENDING: 'yellow', OVERDUE: 'red' };
const PAY_LABEL = { PAID: 'Оплачено', PENDING: 'Ожидает', OVERDUE: 'Просрочено' };
const PAY_METHOD = { CARD: '💳 Карта', CASH: '💵 Наличные', TRANSFER: '🏦 Перевод' };

function fmt(n) { return Number(n).toLocaleString('ru'); }

export default function Finance() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['finance'], queryFn: getFinance });

  const remind = useMutation({
    mutationFn: id => remindPayment(id),
    onSuccess: (_, id) => showToast('Напоминание отправлено', 'Напоминание об оплате отправлено', '💬')
  });

  if (isLoading || !data) return <div className="text-[#64748B] p-8">Загрузка…</div>;

  const { metrics, chartData, debts, paymentLog } = data;
  const maxAmount = Math.max(...chartData.map(d => Number(d.amount)), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-[#64748B] text-sm mt-0.5">Обзор доходов и задолженностей</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-[18px] mb-[22px]">
        {[
          { label: 'Доход за месяц', value: `₽${fmt(metrics.incomeThisMonth)}`, icon: '📈', bg: 'bg-[#DCFCE7]', color: 'text-[#16A34A]', trend: '↑ +8% к прошлому месяцу', trendClass: 'text-[#16A34A]' },
          { label: 'Задолженность', value: `₽${fmt(metrics.totalDebt)}`, icon: '🔴', bg: 'bg-[#FEE2E2]', color: 'text-[#DC2626]', trend: `${metrics.debtorCount} ученик(а)`, trendClass: 'text-[#DC2626]' },
          { label: 'Средний чек', value: `₽${fmt(metrics.avgCheck)}`, icon: '🧾', bg: 'bg-[#EEF2FF]', color: 'text-[#4F46E5]', trend: 'за занятие', trendClass: 'text-[#64748B]' }
        ].map(card => (
          <div key={card.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[#64748B] text-[13px] font-medium">{card.label}</div>
                <div className="text-[28px] font-bold tracking-tight mt-1">{card.value}</div>
              </div>
              <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-xs font-semibold ${card.trendClass}`}>{card.trend}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-[22px]">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <span className="font-bold text-[15px]">Доход за последние 6 месяцев</span>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-[18px] h-[220px] px-2.5 pt-2.5">
            {chartData.map((d, i) => {
              const pct = (Number(d.amount) / maxAmount) * 100;
              const isLast = i === chartData.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-full max-w-[56px] rounded-t-lg relative cursor-pointer hover:brightness-105 transition-all ${
                      isLast
                        ? 'bg-gradient-to-b from-[#7C3AED] to-[#A78BFA]'
                        : 'bg-gradient-to-b from-[#4F46E5] to-[#818CF8]'
                    }`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  >
                    <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-xs font-bold text-[#1E293B] whitespace-nowrap">
                      {Number(d.amount) > 0 ? `₽${Math.round(Number(d.amount)/1000)}k` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Debts */}
      {debts.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-[22px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="font-bold text-[15px]">Задолженности</span>
            <Badge variant="red">{debts.length} должника</Badge>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>{['Ученик', 'Сумма', 'Срок', ''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]">{h}</th>)}</tr>
            </thead>
            <tbody>
              {debts.map(p => {
                const daysPast = Math.floor((Date.now() - new Date(p.dueDate).getTime()) / 86400000);
                return (
                  <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={p.student.initials || p.student.name[0]} color={p.student.color} size="sm" />
                        <span className="font-semibold">{p.student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#DC2626] tabular-nums">₽{fmt(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={daysPast > 7 ? 'red' : 'yellow'}>{daysPast} дн.</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remind.mutate(p.id)}
                      >
                        💬 Напомнить
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment log */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <span className="font-bold text-[15px]">Журнал платежей</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Дата', 'Ученик', 'Сумма', 'Способ', 'Статус'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {paymentLog.map(p => (
              <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                <td className="px-5 py-3.5 text-sm">{new Date(p.dueDate).toLocaleDateString('ru')}</td>
                <td className="px-5 py-3.5 text-sm">{p.student.name}</td>
                <td className={`px-5 py-3.5 font-bold tabular-nums ${p.status === 'PAID' ? 'text-[#16A34A]' : 'text-[#1E293B]'}`}>
                  ₽{fmt(p.amount)}
                </td>
                <td className="px-5 py-3.5 text-sm text-[#64748B]">{PAY_METHOD[p.method] || '—'}</td>
                <td className="px-5 py-3.5"><Badge variant={PAY_STATUS[p.status]}>{PAY_LABEL[p.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace Finance placeholder in `frontend/src/App.jsx`**

```jsx
import Finance from './pages/Finance';
```

Remove `const Finance = () => ...` line.

- [ ] **Step 4: Verify in browser**

Visit `/finance`. Should see metric cards, 6-month bar chart, debts table (if any), payment log.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/finance.js frontend/src/pages/Finance.jsx frontend/src/App.jsx
git commit -m "feat(frontend): finance page with chart, debts, payment log"
```

---

### Task 9: Settings Page

**Files:**
- Create: `frontend/src/api/settings.js`
- Create: `frontend/src/pages/Settings.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/settings → TutorPublic`
- Consumes: `PATCH /api/settings`
- Produces: Settings page with profile form + notification toggles (UI only — no backend notifications in MVP)

- [ ] **Step 1: Create `frontend/src/api/settings.js`**

```js
import client from './client';

export const getSettings = () => client.get('/api/settings').then(r => r.data);
export const updateSettings = data => client.patch('/api/settings', data).then(r => r.data);
```

- [ ] **Step 2: Create `frontend/src/pages/Settings.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { useToast } from '../context/ToastContext';

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${on ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0]'}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </div>
  );
}

const TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Asia/Yekaterinburg',
  'Asia/Novosibirsk',
  'Asia/Vladivostok'
];

export default function Settings() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data: tutor } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [form, setForm] = useState({ name: '', email: '', ratePerHour: '', timezone: '' });
  const [notifications, setNotifications] = useState({ payment: true, session: true, weekly: false });

  useEffect(() => {
    if (tutor) setForm({
      name: tutor.name,
      email: tutor.email,
      ratePerHour: tutor.ratePerHour,
      timezone: tutor.timezone
    });
  }, [tutor]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: data => {
      qc.setQueryData(['settings'], data);
      showToast('Сохранено', 'Настройки успешно обновлены', '✓');
    }
  });

  const initials = form.name?.split(' ').slice(0, 2).map(w => w[0]).join('') || '??';

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      email: form.email,
      ratePerHour: Number(form.ratePerHour),
      timezone: form.timezone
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-[#64748B] text-sm mt-0.5">Профиль и параметры платформы</p>
      </div>

      <div className="max-w-[640px]">
        {/* Profile */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-[22px]">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <span className="font-bold text-[15px]">Профиль</span>
          </div>
          <div className="p-[22px]">
            <div className="flex items-center gap-4 mb-[22px]">
              <Avatar initials={initials} color="#4F46E5" size="lg" />
              <div>
                <div className="font-bold text-base">{form.name}</div>
                <div className="text-[#64748B] text-sm">Репетитор</div>
              </div>
            </div>

            {[
              { label: 'Имя', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Ставка за час (₽)', key: 'ratePerHour', type: 'number' }
            ].map(({ label, key, type }) => (
              <div key={key} className="flex flex-col gap-1.5 mb-[18px]">
                <label className="font-semibold text-[13px]">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5] focus:bg-white"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5 mb-[18px]">
              <label className="font-semibold text-[13px]">Часовой пояс</label>
              <select
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                className="px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5]"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </form>

        {/* Notifications (UI only in MVP) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <span className="font-bold text-[15px]">Уведомления</span>
          </div>
          <div className="px-[22px] pt-2 pb-4">
            {[
              { key: 'payment', label: 'Напоминания об оплате', desc: 'Автоотправка за 3 дня до срока' },
              { key: 'session', label: 'Напоминания о занятиях', desc: 'Ученику за 1 час до начала' },
              { key: 'weekly', label: 'Еженедельный отчёт', desc: 'Сводка по доходам каждый понедельник' }
            ].map(({ key, label, desc }, i, arr) => (
              <div
                key={key}
                className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
              >
                <div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-[#64748B] text-[13px]">{desc}</div>
                </div>
                <Toggle on={notifications[key]} onChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
              </div>
            ))}
          </div>
          <div className="px-[22px] pb-[22px]">
            <Button type="submit" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение…' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace Settings placeholder in `frontend/src/App.jsx`**

```jsx
import Settings from './pages/Settings';
```

Remove `const Settings = () => ...` line.

- [ ] **Step 4: Verify in browser**

Visit `/settings`. Should show profile form pre-filled from API, notification toggles, save button shows toast on success.

- [ ] **Step 5: Final end-to-end check**

With both backend and frontend running:
1. `/login` → login with seed credentials
2. `/` → dashboard shows metrics
3. `/students` → list loads, click student → modal opens all 5 tabs
4. `/schedule` → weekly grid with sessions
5. `/finance` → metrics, chart, payment log
6. `/settings` → profile form, save updates

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/settings.js frontend/src/pages/Settings.jsx frontend/src/App.jsx
git commit -m "feat(frontend): settings page — frontend complete"
```
