import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const SESSION_STATUS = {
  CONFIRMED: ['blue', 'Подтверждено'],
  UNCONFIRMED: ['yellow', 'Не подтверждено'],
  COMPLETED: ['green', 'Завершено'],
  CANCELLED: ['gray', 'Отменено']
};

function fmt(n) {
  return Number(n).toLocaleString('ru');
}

function highlightNames(text) {
  if (!text) return null;
  return text.split(/([А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+)/g).map((part, i) =>
    /^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(part) ? <b key={i}>{part}</b> : part
  );
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
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) return <div className="text-[#64748B] p-8">Загрузка…</div>;
  if (isError) return <div className="text-red-600 p-8">Ошибка загрузки данных</div>;

  const { metrics, todaySessions, recentActivity } = data;

  const METRIC_CARDS = [
    { label: 'Всего учеников', value: metrics.studentCount, icon: '👥', bg: 'bg-[#EEF2FF]', color: 'text-[#4F46E5]' },
    { label: 'Занятий в месяце', value: metrics.sessionsThisMonth, icon: '📅', bg: 'bg-[#DBEAFE]', color: 'text-[#2563EB]' },
    { label: 'Доход за месяц', value: `₽${fmt(metrics.incomeThisMonth)}`, icon: '💰', bg: 'bg-[#DCFCE7]', color: 'text-[#16A34A]' },
    { label: 'Неоплаченных счетов', value: metrics.overduePayments, icon: '⚠️', bg: 'bg-[#FEE2E2]', color: 'text-[#DC2626]' }
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
              <div key={event.time + i} className="flex gap-3 px-5 py-3">
                <div className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center text-[15px] bg-[#DCFCE7] text-[#16A34A]">
                  {event.icon}
                </div>
                <div>
                  <div className="text-[13.5px]">{highlightNames(event.text)}</div>
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
