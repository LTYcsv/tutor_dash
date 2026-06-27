const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const ref = month ? new Date(`${month}-01`) : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

    const where = { dueDate: { gte: monthStart, lt: monthEnd } };

    const [payments, paidAgg, pendingAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { student: { select: { id: true, name: true, initials: true, color: true } } },
        orderBy: { dueDate: 'desc' }
      }),
      prisma.payment.findMany({ where: { ...where, status: 'PAID' }, select: { method: true, amount: true } }),
      prisma.payment.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { amount: true } })
    ]);

    const total = paidAgg.reduce((sum, p) => sum + Number(p.amount), 0);
    const byMethod = paidAgg.reduce((acc, p) => {
      if (!p.method) return acc;
      acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
      return acc;
    }, {});

    res.json({
      payments,
      total,
      byMethod,
      pending: pendingAgg._sum.amount ?? 0
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
