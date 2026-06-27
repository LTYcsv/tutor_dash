const express = require('express');
const prisma = require('../prisma');
const { generateInitials } = require('../services/students');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        subjects: true,
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, initials, color, phone, parentContact, subject, level, rate } = req.body;
    if (!name || !phone || !subject || !level) {
      return res.status(400).json({ error: 'name, phone, subject, level required' });
    }
    const student = await prisma.student.create({
      data: {
        name,
        initials: initials || generateInitials(name),
        color: color || '#4F46E5',
        phone,
        parentContact: parentContact || null,
        subjects: {
          create: { subject, level, ratePerHour: rate || null }
        }
      },
      include: { subjects: true }
    });
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { isOverdue } = require('../services/homework');
    const student = await prisma.student.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        subjects: {
          include: {
            topics: { orderBy: { sortOrder: 'asc' } },
            sessions: {
              include: { homework: true },
              orderBy: { startTime: 'desc' }
            }
          }
        },
        payments: { orderBy: { dueDate: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } }
      }
    });

    const result = {
      ...student,
      subjects: student.subjects.map(sub => ({
        ...sub,
        sessions: sub.sessions.map(session => ({
          ...session,
          homework: session.homework.map(hw => ({
            ...hw,
            isOverdue: isOverdue(hw, session)
          }))
        }))
      }))
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, initials, color, phone, parentContact } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(initials !== undefined && { initials }),
        ...(color && { color }),
        ...(phone && { phone }),
        ...(parentContact !== undefined && { parentContact })
      }
    });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
