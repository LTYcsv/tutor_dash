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
