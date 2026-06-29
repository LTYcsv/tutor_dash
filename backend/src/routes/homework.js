const express = require('express');
const prisma = require('../prisma');
const { isOverdue } = require('../services/homework');
const router = express.Router();

const homeworkInclude = {
  session: {
    include: {
      studentSubject: {
        include: {
          student: { select: { id: true, name: true, initials: true, color: true } }
        }
      }
    }
  }
};

function formatHw(hw) {
  const { session, ...rest } = hw;
  return {
    ...rest,
    sessionDate: session.startTime,
    subject: session.studentSubject.subject,
    student: session.studentSubject.student,
    isOverdue: isOverdue(hw, session)
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const rows = await prisma.homework.findMany({
      where,
      include: homeworkInclude,
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }]
    });
    res.json(rows.map(formatHw));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { sessionId, studentId, title, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    let resolvedSessionId = sessionId;

    if (!resolvedSessionId && studentId) {
      const latest = await prisma.session.findFirst({
        where: { studentSubject: { studentId } },
        orderBy: { startTime: 'desc' }
      });
      if (!latest) return res.status(400).json({ error: 'No session found for student' });
      resolvedSessionId = latest.id;
    }

    if (!resolvedSessionId) return res.status(400).json({ error: 'sessionId or studentId required' });

    const hw = await prisma.homework.create({
      data: {
        sessionId: resolvedSessionId,
        title,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: homeworkInclude
    });
    res.status(201).json(formatHw(hw));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, grade, dueDate } = req.body;
    const hw = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(grade !== undefined && { grade: grade !== null ? Number(grade) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      },
      include: homeworkInclude
    });
    res.json(formatHw(hw));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
