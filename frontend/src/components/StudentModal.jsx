import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudent, updateHomework, createHomework, toggleTopic, remindPayment } from '../api/students';
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
  const [showHwForm, setShowHwForm] = useState(false);
  const [hwForm, setHwForm] = useState({ title: '', dueDate: '' });
  const [gradePicker, setGradePicker] = useState(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId
  });

  const hwMutation = useMutation({
    mutationFn: ({ id, status }) => updateHomework(id, { status }),
    onSuccess: (_, { status, id }) => {
      qc.invalidateQueries({ queryKey: ['student', studentId] });
      qc.invalidateQueries({ queryKey: ['homework'] });
      if (status === 'CHECKED') setGradePicker(id);
      else if (gradePicker === id) setGradePicker(null);
    }
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade }) => updateHomework(id, { grade }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', studentId] });
      qc.invalidateQueries({ queryKey: ['homework'] });
      setGradePicker(null);
    },
    onError: () => showToast('Ошибка', 'Не удалось сохранить оценку', '❌')
  });

  const createHwMutation = useMutation({
    mutationFn: data => createHomework(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', studentId] });
      qc.invalidateQueries({ queryKey: ['homework'] });
      setHwForm({ title: '', dueDate: '' });
      setShowHwForm(false);
      showToast('Задание добавлено', hwForm.title, '📝');
    },
    onError: () => showToast('Ошибка', 'Не удалось добавить задание', '❌')
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
              <div>
                {/* Inline create form */}
                {showHwForm ? (
                  <div className="mb-4 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <div className="flex gap-2 mb-2.5">
                      <input
                        type="text"
                        value={hwForm.title}
                        onChange={e => setHwForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Название задания…"
                        className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                        autoFocus
                      />
                      <input
                        type="date"
                        value={hwForm.dueDate}
                        onChange={e => setHwForm(f => ({ ...f, dueDate: e.target.value }))}
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!hwForm.title.trim() || createHwMutation.isPending}
                        onClick={() => createHwMutation.mutate({
                          studentId,
                          title: hwForm.title.trim(),
                          dueDate: hwForm.dueDate || null
                        })}
                      >
                        {createHwMutation.isPending ? 'Сохранение…' : '＋ Добавить'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowHwForm(false); setHwForm({ title: '', dueDate: '' }); }}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHwForm(true)}
                    className="mb-3.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                  >
                    <span className="text-base leading-none">＋</span> Задать домашку
                  </button>
                )}

                {homework.length === 0 && !showHwForm ? (
                  <p className="text-[#94A3B8] text-[13px] py-4 text-center">Заданий пока нет</p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['Дата', 'Задание', 'Срок', 'Статус', 'Оценка'].map(h => (
                          <th key={h} className="text-left py-2 px-2.5 text-xs text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {homework.map(hw => (
                        <tr
                          key={hw.id}
                          className={`border-b border-[#E2E8F0] last:border-0 ${hw.isOverdue ? 'bg-[#FFF8F8]' : ''}`}
                        >
                          <td className="py-2.5 px-2.5 text-[13px] text-[#64748B] whitespace-nowrap">
                            {new Date(hw.sessionDate).toLocaleDateString('ru')}
                          </td>
                          <td className="py-2.5 px-2.5 text-[13.5px]">{hw.title}</td>
                          <td className="py-2.5 px-2.5 text-[13px] whitespace-nowrap">
                            {hw.dueDate
                              ? <span className={hw.isOverdue ? 'text-[#DC2626] font-semibold' : 'text-[#64748B]'}>
                                  {new Date(hw.dueDate).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                                </span>
                              : <span className="text-[#94A3B8]">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-2.5">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={hw.isOverdue ? 'red' : HW_STATUS[hw.status]}
                                onClick={() => hwMutation.mutate({ id: hw.id, status: HW_NEXT[hw.status] })}
                              >
                                {hw.isOverdue ? 'Просрочено' : HW_LABEL[hw.status]}
                              </Badge>
                              {gradePicker === hw.id && (
                                <div className="flex gap-1 items-center mt-0.5">
                                  {[1, 2, 3, 4, 5].map(g => (
                                    <button
                                      key={g}
                                      onClick={() => gradeMutation.mutate({ id: hw.id, grade: g })}
                                      className={`w-6 h-6 rounded text-[12px] font-bold transition-all border ${
                                        g >= 5 ? 'border-[#16A34A] text-[#16A34A] hover:bg-[#DCFCE7]' :
                                        g >= 4 ? 'border-[#2563EB] text-[#2563EB] hover:bg-[#DBEAFE]' :
                                        'border-[#CA8A04] text-[#CA8A04] hover:bg-[#FEF9C3]'
                                      }`}
                                    >{g}</button>
                                  ))}
                                  <button onClick={() => setGradePicker(null)} className="text-[11px] text-[#94A3B8] hover:text-[#64748B] ml-0.5">пропустить</button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5">
                            {hw.grade != null ? (
                              <span className={`font-bold px-2 py-0.5 rounded text-[13px] ${
                                hw.grade >= 5 ? 'bg-[#DCFCE7] text-[#16A34A]' :
                                hw.grade >= 4 ? 'bg-[#DBEAFE] text-[#2563EB]' :
                                'bg-[#FEF9C3] text-[#CA8A04]'
                              }`}>{hw.grade}</span>
                            ) : <span className="text-[#94A3B8]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'payments' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>{['Дата', 'Сумма', 'Статус'].map(h => <th key={h} className="text-left py-2 px-2.5 text-xs text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(student.payments ?? []).map(p => (
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
                {(student.notes ?? []).map(note => (
                  <div key={note.id} className="bg-[#F8FAFC] rounded-xl p-3.5 mb-3">
                    <div className="text-[#64748B] text-xs font-semibold mb-1">{new Date(note.createdAt).toLocaleDateString('ru')}</div>
                    <div className="text-sm">{note.content}</div>
                  </div>
                ))}
                {(student.notes ?? []).length === 0 && <p className="text-[#64748B] text-sm">Заметок пока нет</p>}
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
