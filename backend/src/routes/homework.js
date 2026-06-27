const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, grade } = req.body;
    const hw = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(grade !== undefined && { grade: grade !== null ? Number(grade) : null })
      }
    });
    res.json(hw);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
