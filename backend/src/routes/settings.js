const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: req.tutor.id } });
    const { passwordHash, ...data } = tutor;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: req.tutor.id } });
    const valid = await bcrypt.compare(currentPassword, tutor.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.tutor.update({ where: { id: req.tutor.id }, data: { passwordHash } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { name, email, ratePerHour, timezone } = req.body;
    const tutor = await prisma.tutor.update({
      where: { id: req.tutor.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(ratePerHour != null && { ratePerHour }),
        ...(timezone && { timezone })
      }
    });
    const { passwordHash, ...data } = tutor;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
