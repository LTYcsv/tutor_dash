import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHomework, createHomework, updateHomework, getStudents } from '../api/students';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const HW_STATUS = { ASSIGNED: 'gray', SUBMITTED: 'yellow', CHECKED: 'green' };
const HW_LABEL = { ASSIGNED: 'Задано', SUBMITTED: 'Сдано', CHECKED: 'Проверено' };
const HW_NEXT = { ASSIGNED: 'SUBMITTED', SUBMITTED: 'CHECKED', CHECKED: 'ASSIGNED' };

const FILTERS = [
  { key: 'ALL', label: 'Все' },
  { key: 'OVERDUE', label: 'Просрочено' },
  { key: 'ASSIGNED', label: 'Задано' },
  { key: 'SUBMITTED', label: 'Сдано' },
  { key: 'CHECKED', label: 'Проверено' }
];

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E2E8F0]">
      {[140, 200, 80, 80, 60, 30].map((w, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function CreateModal({ onClose, students }) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState({ studentId: '', title: '', dueDate: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      showToast('Задание добавлено', form.title, '📝');
      onClose();
    },
    onError: () => setError('Не удалось сохранить')
  });

  function submit(e) {
    e.preventDefault();
    if (!form.studentId) { setError('Выберите ученика'); return; }
    if (!form.title.trim()) { setError('Введите название задания'); return; }
    setError('');
    mutation.mutate({
      studentId: form.studentId,
      title: form.title.trim(),
      dueDate: form.dueDate || null
    });
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-[4px] z-[100] flex items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.05)] w-full max-w-md"
        style={{ animation: 'pop 0.25s ease' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[17px] font-bold">Новое задание</h2>
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] bg-white/70 hover:bg-[#F8FAFC] rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-all"
          >✕</button>
        </div>

        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1.5">Ученик</label>
            <select
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
            >
              <option value="">Выбрать ученика…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1.5">Задание</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Название задания…"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1.5">Срок сдачи <span className="font-normal text-[#94A3B8]">(необязательно)</span></label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
            />
          </div>

          {error && <p className="text-[#DC2626] text-[13px]">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение…' : '＋ Добавить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Homework() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [gradePicker, setGradePicker] = useState(null);

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ['homework'],
    queryFn: () => getHomework()
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateHomework(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['homework'] });
      const prev = qc.getQueryData(['homework']);
      qc.setQueryData(['homework'], old =>
        (old || []).map(h => h.id === id ? { ...h, status } : h)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      qc.setQueryData(['homework'], ctx.prev);
      showToast('Ошибка', 'Не удалось сохранить изменение', '❌');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['homework'] })
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade }) => updateHomework(id, { grade }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      setGradePicker(null);
    },
    onError: () => showToast('Ошибка', 'Не удалось сохранить оценку', '❌')
  });

  const counts = {
    ALL: homework.length,
    OVERDUE: homework.filter(h => h.isOverdue).length,
    ASSIGNED: homework.filter(h => h.status === 'ASSIGNED' && !h.isOverdue).length,
    SUBMITTED: homework.filter(h => h.status === 'SUBMITTED').length,
    CHECKED: homework.filter(h => h.status === 'CHECKED').length
  };

  const filtered = filter === 'ALL'
    ? homework
    : filter === 'OVERDUE'
      ? homework.filter(h => h.isOverdue)
      : homework.filter(h => h.status === filter && !h.isOverdue);

  function handleStatusClick(hw) {
    const next = HW_NEXT[hw.status];
    statusMutation.mutate({ id: hw.id, status: next });
    if (next === 'CHECKED') {
      setGradePicker(hw.id);
    } else {
      setGradePicker(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Домашние задания</h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            {homework.length} {homework.length === 1 ? 'задание' : 'заданий'} всего
            {counts.OVERDUE > 0 && (
              <span className="ml-2 text-[#DC2626] font-semibold">· {counts.OVERDUE} просрочено</span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>＋ Задание</Button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        {/* Filter tabs */}
        <div className="px-5 py-0 border-b border-[#E2E8F0] flex gap-0.5 items-center">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-[13px] text-[13.5px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                filter === f.key
                  ? 'text-[#4F46E5] border-[#4F46E5]'
                  : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
              }`}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  filter === f.key
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : f.key === 'OVERDUE'
                      ? 'bg-[#FEE2E2] text-[#DC2626]'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Ученик', 'Задание', 'Срок', 'Статус', 'Оценка', ''].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="text-[#94A3B8] text-3xl mb-3">📋</div>
                      <div className="text-[#64748B] font-semibold text-sm">
                        {filter === 'ALL' ? 'Заданий пока нет' : 'Ничего не найдено'}
                      </div>
                      {filter === 'ALL' && (
                        <div className="text-[#94A3B8] text-[13px] mt-1">
                          Нажмите «＋ Задание» чтобы добавить первое
                        </div>
                      )}
                    </td>
                  </tr>
                )
                : filtered.map(hw => {
                  const overdue = hw.isOverdue;
                  const isGradePicking = gradePicker === hw.id;

                  return (
                    <tr
                      key={hw.id}
                      className={`border-b border-[#E2E8F0] last:border-0 transition-colors ${
                        overdue ? 'bg-[#FFF8F8] hover:bg-[#FFF0F0]' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            initials={hw.student.initials || hw.student.name[0]}
                            color={hw.student.color}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-sm text-[#1E293B]">{hw.student.name}</div>
                            <div className="text-[#94A3B8] text-xs">{hw.subject}</div>
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-3.5 text-sm text-[#1E293B] max-w-[260px]">
                        <span className="line-clamp-1">{hw.title}</span>
                      </td>

                      {/* Due date */}
                      <td className="px-5 py-3.5 text-[13px] whitespace-nowrap">
                        {hw.dueDate
                          ? <span className={overdue ? 'text-[#DC2626] font-semibold' : 'text-[#64748B]'}>
                              {fmtDate(hw.dueDate)}
                              {overdue && <span className="ml-1 text-[11px]">(!)</span>}
                            </span>
                          : <span className="text-[#94A3B8]">—</span>
                        }
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant={overdue ? 'red' : HW_STATUS[hw.status]}
                            onClick={() => handleStatusClick(hw)}
                          >
                            {overdue ? 'Просрочено' : HW_LABEL[hw.status]}
                          </Badge>
                          {isGradePicking && (
                            <div className="flex gap-1 items-center mt-0.5">
                              <span className="text-[11px] text-[#64748B] mr-0.5">Оценка:</span>
                              {[1, 2, 3, 4, 5].map(g => (
                                <button
                                  key={g}
                                  onClick={() => gradeMutation.mutate({ id: hw.id, grade: g })}
                                  className={`w-6 h-6 rounded text-[12px] font-bold transition-all border ${
                                    g >= 5
                                      ? 'border-[#16A34A] text-[#16A34A] hover:bg-[#DCFCE7]'
                                      : g >= 4
                                        ? 'border-[#2563EB] text-[#2563EB] hover:bg-[#DBEAFE]'
                                        : 'border-[#CA8A04] text-[#CA8A04] hover:bg-[#FEF9C3]'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                              <button
                                onClick={() => setGradePicker(null)}
                                className="text-[11px] text-[#94A3B8] hover:text-[#64748B] ml-1"
                              >
                                пропустить
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="px-5 py-3.5">
                        {hw.grade != null
                          ? <span className={`inline-block font-bold px-2 py-0.5 rounded text-[13px] ${
                              hw.grade >= 5 ? 'bg-[#DCFCE7] text-[#16A34A]' :
                              hw.grade >= 4 ? 'bg-[#DBEAFE] text-[#2563EB]' :
                              'bg-[#FEF9C3] text-[#CA8A04]'
                            }`}>{hw.grade}</span>
                          : <span className="text-[#94A3B8] text-sm">—</span>
                        }
                      </td>

                      {/* Empty actions col */}
                      <td className="px-5 py-3.5 w-8" />
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} students={students} />
      )}
    </div>
  );
}
