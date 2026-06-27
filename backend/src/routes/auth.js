const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const tutor = await prisma.tutor.findUnique({ where: { email } });
    if (!tutor) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, tutor.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: tutor.id, email: tutor.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...tutorData } = tutor;
    res.json({ token, tutor: tutorData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
