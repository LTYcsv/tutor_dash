import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStudent } from '../api/students';
import Modal from './Modal';
import Button from './Button';
import { useToast } from '../context/ToastContext';

const SUBJECTS = ['Математика', 'Физика', 'Английский', 'Химия', 'Биология', 'История'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const EMPTY = { name: '', phone: '', subject: '', level: '' };

export default function CreateStudentModal({ open, onClose }) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);

  const mutation = useMutation({
    mutationFn: () => createStudent(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      showToast('Ученик добавлен', form.name, '✅');
      setForm(EMPTY);
      onClose();
    }
  });

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const valid = form.name && form.phone && form.subject && form.level;

  return (
    <Modal open={open} onClose={onClose} maxWidth="480px">
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <h2 className="text-lg font-bold">Добавить ученика</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] text-lg">✕</button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-[#1E293B] mb-1.5 block">Имя <span className="text-[#DC2626]">*</span></label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="Иван Петров"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC] focus:bg-white"
          />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-[#1E293B] mb-1.5 block">Телефон <span className="text-[#DC2626]">*</span></label>
          <input
            value={form.phone}
            onChange={set('phone')}
            placeholder="+7 900 000 00 00"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC] focus:bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-semibold text-[#1E293B] mb-1.5 block">Предмет <span className="text-[#DC2626]">*</span></label>
            <input
              value={form.subject}
              onChange={set('subject')}
              list="subjects-list"
              placeholder="Математика"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC] focus:bg-white"
            />
            <datalist id="subjects-list">
              {SUBJECTS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#1E293B] mb-1.5 block">Уровень <span className="text-[#DC2626]">*</span></label>
            <select
              value={form.level}
              onChange={set('level')}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] bg-[#F8FAFC]"
            >
              <option value="">—</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
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
