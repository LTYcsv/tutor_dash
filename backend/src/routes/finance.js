const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Last 6 months range
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [allPaid, allDebt, chartPayments, paymentLog] = await Promise.all([
      // Paid this month
      prisma.payment.findMany({
        where: { dueDate: { gte: monthStart, lt: monthEnd }, status: 'PAID' },
        select: { amount: true }
      }),
      // Pending/overdue (all time) for debt metrics
      prisma.payment.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        select: { amount: true, studentId: true }
      }),
      // Last 6 months paid for chart
      prisma.payment.findMany({
        where: { dueDate: { gte: sixMonthsAgo }, status: 'PAID' },
        select: { amount: true, dueDate: true }
      }),
      // Payment log: all payments this month
      prisma.payment.findMany({
        where: { dueDate: { gte: monthStart, lt: monthEnd } },
        include: { student: { select: { id: true, name: true, initials: true, color: true } } },
        orderBy: { dueDate: 'desc' }
      })
    ]);

    const incomeThisMonth = allPaid.reduce((s, p) => s + Number(p.amount), 0);
    const totalDebt = allDebt.reduce((s, p) => s + Number(p.amount), 0);
    const debtorCount = new Set(allDebt.map(p => p.studentId)).size;
    const avgCheck = allPaid.length ? Math.round(incomeThisMonth / allPaid.length) : 0;

    // Build chartData: one entry per month for last 6 months
    const monthTotals = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('ru', { month: 'short' });
      monthTotals[key] = { month: label, amount: 0 };
    }
    for (const p of chartPayments) {
      const d = new Date(p.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthTotals[key]) monthTotals[key].amount += Number(p.amount);
    }
    const chartData = Object.values(monthTotals);

    // Debts: pending/overdue with student
    const debts = await prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      include: { student: { select: { id: true, name: true, initials: true, color: true } } },
      orderBy: { dueDate: 'asc' }
    });

    res.json({
      metrics: { incomeThisMonth, totalDebt, debtorCount, avgCheck },
      chartData,
      debts,
      paymentLog
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
