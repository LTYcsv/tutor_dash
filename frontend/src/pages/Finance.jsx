import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinance, remindPayment } from '../api/finance';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const PAY_STATUS = { PAID: 'green', PENDING: 'yellow', OVERDUE: 'red' };
const PAY_LABEL = { PAID: 'Оплачено', PENDING: 'Ожидает', OVERDUE: 'Просрочено' };
const PAY_METHOD = { CARD: '💳 Карта', CASH: '💵 Наличные', TRANSFER: '🏦 Перевод' };

function fmt(n) { return Number(n).toLocaleString('ru'); }

export default function Finance() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['finance'], queryFn: getFinance });

  const remind = useMutation({
    mutationFn: id => remindPayment(id),
    onSuccess: () => showToast('Напоминание отправлено', 'Напоминание об оплате отправлено', '💬')
  });

  if (isLoading || !data) return <div className="text-[#64748B] p-8">Загрузка…</div>;

  const { metrics, chartData, debts, paymentLog } = data;
  const maxAmount = Math.max(...chartData.map(d => Number(d.amount)), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-[#64748B] text-sm mt-0.5">Обзор доходов и задолженностей</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-[18px] mb-[22px]">
        {[
          { label: 'Доход за месяц', value: `₽${fmt(metrics.incomeThisMonth)}`, icon: '📈', bg: 'bg-[#DCFCE7]', color: 'text-[#16A34A]', trend: '↑ +8% к прошлому месяцу', trendClass: 'text-[#16A34A]' },
          { label: 'Задолженность', value: `₽${fmt(metrics.totalDebt)}`, icon: '🔴', bg: 'bg-[#FEE2E2]', color: 'text-[#DC2626]', trend: `${metrics.debtorCount} ученик(а)`, trendClass: 'text-[#DC2626]' },
          { label: 'Средний чек', value: `₽${fmt(metrics.avgCheck)}`, icon: '🧾', bg: 'bg-[#EEF2FF]', color: 'text-[#4F46E5]', trend: 'за занятие', trendClass: 'text-[#64748B]' }
        ].map(card => (
          <div key={card.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[#64748B] text-[13px] font-medium">{card.label}</div>
                <div className="text-[28px] font-bold tracking-tight mt-1">{card.value}</div>
              </div>
              <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-xs font-semibold ${card.trendClass}`}>{card.trend}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-[22px]">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <span className="font-bold text-[15px]">Доход за последние 6 месяцев</span>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-[18px] h-[220px] px-2.5 pt-2.5">
            {chartData.map((d, i) => {
              const pct = (Number(d.amount) / maxAmount) * 100;
              const isLast = i === chartData.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-full max-w-[56px] rounded-t-lg relative cursor-pointer hover:brightness-105 transition-all ${
                      isLast
                        ? 'bg-gradient-to-b from-[#7C3AED] to-[#A78BFA]'
                        : 'bg-gradient-to-b from-[#4F46E5] to-[#818CF8]'
                    }`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  >
                    <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-xs font-bold text-[#1E293B] whitespace-nowrap">
                      {Number(d.amount) > 0 ? `₽${Math.round(Number(d.amount) / 1000)}k` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Debts */}
      {debts.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-[22px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="font-bold text-[15px]">Задолженности</span>
            <Badge variant="red">{debts.length} должника</Badge>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Ученик', 'Сумма', 'Срок', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {debts.map(p => {
                const daysPast = Math.floor((Date.now() - new Date(p.dueDate).getTime()) / 86400000);
                return (
                  <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={p.student.initials || p.student.name[0]} color={p.student.color} size="sm" />
                        <span className="font-semibold">{p.student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#DC2626] tabular-nums">₽{fmt(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={daysPast > 7 ? 'red' : 'yellow'}>{daysPast} дн.</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => remind.mutate(p.id)}>
                        💬 Напомнить
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment log */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <span className="font-bold text-[15px]">Журнал платежей</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Дата', 'Ученик', 'Сумма', 'Способ', 'Статус'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] bg-[#FCFCFD]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paymentLog.map(p => (
              <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                <td className="px-5 py-3.5 text-sm">{new Date(p.dueDate).toLocaleDateString('ru')}</td>
                <td className="px-5 py-3.5 text-sm">{p.student.name}</td>
                <td className={`px-5 py-3.5 font-bold tabular-nums ${p.status === 'PAID' ? 'text-[#16A34A]' : 'text-[#1E293B]'}`}>
                  ₽{fmt(p.amount)}
                </td>
                <td className="px-5 py-3.5 text-sm text-[#64748B]">{PAY_METHOD[p.method] || '—'}</td>
                <td className="px-5 py-3.5"><Badge variant={PAY_STATUS[p.status]}>{PAY_LABEL[p.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
