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
        key={selectedId}
        studentId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
