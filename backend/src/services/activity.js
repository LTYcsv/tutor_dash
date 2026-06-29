const prisma = require('../prisma');

async function getRecentActivity(limit = 10) {
  const [payments, sessions, homework] = await Promise.all([
    prisma.payment.findMany({
      take: limit,
      orderBy: { dueDate: 'desc' },
      include: { student: { select: { id: true, name: true, initials: true, color: true } } }
    }),
    prisma.session.findMany({
      take: limit,
      orderBy: { startTime: 'desc' },
      include: { studentSubject: { include: { student: { select: { id: true, name: true, initials: true, color: true } } } } }
    }),
    prisma.homework.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        session: {
          include: { studentSubject: { include: { student: { select: { id: true, name: true, initials: true, color: true } } } } }
        }
      }
    })
  ]);

  const PAY_ICON = { PAID: '💰', PENDING: '⏳', OVERDUE: '🔴' };
  const PAY_TEXT = {
    PAID: name => `Платёж получен от ${name}`,
    PENDING: name => `Ожидается оплата от ${name}`,
    OVERDUE: name => `Просрочен платёж: ${name}`
  };
  const SESSION_ICON = { CONFIRMED: '📅', COMPLETED: '✅', CANCELLED: '❌', UNCONFIRMED: '🕐' };
  const SESSION_TEXT = {
    CONFIRMED: name => `Занятие запланировано с ${name}`,
    COMPLETED: name => `Занятие завершено с ${name}`,
    CANCELLED: name => `Занятие отменено: ${name}`,
    UNCONFIRMED: name => `Занятие ожидает подтверждения: ${name}`
  };
  const HW_ICON = { ASSIGNED: '📝', SUBMITTED: '📬', CHECKED: '✅' };
  const HW_TEXT = {
    ASSIGNED: name => `Домашка задана: ${name}`,
    SUBMITTED: name => `Домашка сдана: ${name}`,
    CHECKED: name => `Домашка проверена: ${name}`
  };

  const items = [
    ...payments.map(p => ({
      icon: PAY_ICON[p.status] || '💳',
      text: (PAY_TEXT[p.status] || (n => n))(p.student?.name || ''),
      time: p.dueDate
    })),
    ...sessions.map(s => ({
      icon: SESSION_ICON[s.status] || '📅',
      text: (SESSION_TEXT[s.status] || (n => n))(s.studentSubject?.student?.name || ''),
      time: s.startTime
    })),
    ...homework.map(h => ({
      icon: HW_ICON[h.status] || '📝',
      text: (HW_TEXT[h.status] || (n => n))(h.session?.studentSubject?.student?.name || ''),
      time: h.updatedAt
    }))
  ];

  return items
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit);
}

module.exports = { getRecentActivity };
