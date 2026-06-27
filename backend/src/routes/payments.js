const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const payments = await prisma.payment.findMany({
      where: studentId ? { studentId } : {},
      include: { student: { select: { id: true, name: true, initials: true, color: true } } },
      orderBy: { dueDate: 'desc' }
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { studentId, amount, method, status, dueDate } = req.body;
    if (!studentId || amount == null || !method || !dueDate) {
      return res.status(400).json({ error: 'studentId, amount, method, dueDate required' });
    }
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount,
        method,
        status: status || 'PENDING',
        dueDate: new Date(dueDate)
      }
    });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, method, amount, dueDate } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(method && { method }),
        ...(amount != null && { amount }),
        ...(dueDate && { dueDate: new Date(dueDate) })
      }
    });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
