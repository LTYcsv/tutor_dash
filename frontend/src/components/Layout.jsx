import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/students', label: 'Ученики' },
  { to: '/homework', label: 'Домашка' },
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
