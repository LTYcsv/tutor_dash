const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { week } = req.query;
    let where = {};
    if (week) {
      const monday = new Date(week);
      const sunday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
      where = { startTime: { gte: monday, lt: sunday } };
    }
    const sessions = await prisma.session.findMany({
      where,
      include: {
        studentSubject: { include: { student: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { studentSubjectId, startTime, durationMin, status } = req.body;
    if (!studentSubjectId || !startTime || !durationMin) {
      return res.status(400).json({ error: 'studentSubjectId, startTime, durationMin required' });
    }
    const session = await prisma.session.create({
      data: {
        studentSubjectId,
        startTime: new Date(startTime),
        durationMin: Number(durationMin),
        status: status || 'CONFIRMED'
      },
      include: { studentSubject: { include: { student: true } } }
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, startTime, durationMin } = req.body;
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(durationMin && { durationMin: Number(durationMin) })
      }
    });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
