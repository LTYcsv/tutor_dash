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

  const items = [
    ...payments.map(p => ({
      type: 'payment',
      date: p.dueDate,
      student: p.student,
      data: p
    })),
    ...sessions.map(s => ({
      type: 'session',
      date: s.startTime,
      student: s.studentSubject?.student,
      data: s
    })),
    ...homework.map(h => ({
      type: 'homework',
      date: h.updatedAt,
      student: h.session?.studentSubject?.student,
      data: h
    }))
  ];

  return items
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

module.exports = { getRecentActivity };
