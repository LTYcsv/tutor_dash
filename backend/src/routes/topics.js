const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { studentSubjectId, title, sortOrder } = req.body;
    if (!studentSubjectId || !title) {
      return res.status(400).json({ error: 'studentSubjectId and title required' });
    }
    const topic = await prisma.topic.create({
      data: { studentSubjectId, title, sortOrder: sortOrder ?? 0 }
    });
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { completed, title } = req.body;
    const topic = await prisma.topic.update({
      where: { id: req.params.id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title && { title })
      }
    });
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.topic.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
