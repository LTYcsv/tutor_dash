const express = require('express');
const prisma = require('../prisma');
const { getRecentActivity } = require('../services/activity');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const sessionInclude = {
      include: { studentSubject: { include: { student: true } } }
    };

    const [
      todaySessions,
      weekSessions,
      studentsCount,
      pendingPayments,
      monthPaidPayments,
      recentActivity
    ] = await Promise.all([
      prisma.session.findMany({ where: { startTime: { gte: todayStart, lt: todayEnd } }, ...sessionInclude, orderBy: { startTime: 'asc' } }),
      prisma.session.findMany({ where: { startTime: { gte: weekStart, lt: weekEnd } }, ...sessionInclude, orderBy: { startTime: 'asc' } }),
      prisma.student.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: monthStart, lt: monthEnd } }, _sum: { amount: true } }),
      getRecentActivity(10)
    ]);

    res.json({
      todaySessions,
      weekSessions,
      recentActivity,
      stats: {
        studentsCount,
        monthEarnings: monthPaidPayments._sum.amount ?? 0,
        pendingPayments
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
