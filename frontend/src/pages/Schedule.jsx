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
