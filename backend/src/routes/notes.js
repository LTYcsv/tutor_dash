const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { studentId, content } = req.body;
    if (!studentId || !content) {
      return res.status(400).json({ error: 'studentId and content required' });
    }
    const note = await prisma.note.create({ data: { studentId, content } });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { content } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { content }
    });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
