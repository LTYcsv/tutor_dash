import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

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
