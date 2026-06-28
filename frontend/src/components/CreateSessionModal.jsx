import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSession } from '../api/sessions';
import { getStudents } from '../api/students';
import Modal from './Modal';
import Button from './Button';
import { useToast } from '../context/ToastContext';

const DURATIONS = [45, 60, 90, 120];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function CreateSessionModal({ open, onClose, defaultDate, defaultHour }) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ studentSubjectId: '', date: defaultDate || today, hour: defaultHour ?? 9, durationMin: 60 });

  useEffect(() => {
    if (open) setForm(f => ({ ...f, date: defaultDate || today, hour: defaultHour ?? f.hour }));
  }, [open, defaultDate, defaultHour]);

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getStudents, enabled: open });

  const mutation = useMutation({
    mutationFn: () => {
      const startTime = new Date(`${form.date}T${String(form.hour).padStart(2, '0')}:00:00`);
      return createSession({ studentSubjectId: form.studentSubjectId, startTime: startTime.toISOString(), durationMin: form.durationMin });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      showToast('Занятие добавлено', '', '📅');
      onClose();
    }
  });

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const valid = form.studentSubjectId && form.date;

  const subjectOptions = students.flatMap(s =>
    (s.subjects || []).map(sub => ({ value: sub.id, label: `${s.name} — ${sub.subject}` }))
  );

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <h2 className="text-lg font-bold">Добавить занятие</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] text-lg">✕</button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5 block">Ученик / Предмет *</label>
          <select
            value={form.studentSubjectId}
            onChange={set('studentSubjectId')}
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC]"
          >
            <option value="">— выбрать —</option>
            {subjectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5 block">Дата *</label>
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5 block">Время *</label>
            <select
              value={form.hour}
              onChange={e => setForm(f => ({ ...f, hour: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC]"
            >
              {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5 block">Длительность</label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setForm(f => ({ ...f, durationMin: d }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                  form.durationMin === d
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#4F46E5]'
                }`}
              >
                {d} мин
              </button>
            ))}
          </div>
        </div>
        {mutation.isError && (
          <p className="text-red-600 text-sm">{mutation.error?.response?.data?.error || 'Ошибка сохранения'}</p>
        )}
      </div>
      <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-2 justify-end bg-[#F8FAFC]">
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Сохранение…' : 'Добавить'}
        </Button>
      </div>
    </Modal>
  );
}
