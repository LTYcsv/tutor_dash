require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const prisma = new PrismaClient();

async function cleanDb() {
  await prisma.$executeRaw`TRUNCATE TABLE "Note", "Payment", "Homework", "Topic", "Session", "StudentSubject", "Student", "Tutor" CASCADE`;
}

async function seedTutor(overrides = {}) {
  const passwordHash = await bcrypt.hash(overrides.password || 'password123', 12);
  return prisma.tutor.create({
    data: {
      name: 'Test Tutor',
      email: 'tutor@test.com',
      ratePerHour: 1500,
      timezone: 'Europe/Moscow',
      ...overrides,
      passwordHash
    }
  });
}

async function getAuthToken(app) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@test.com', password: 'password123' });
  return res.body.token;
}

afterAll(() => prisma.$disconnect());

module.exports = { prisma, cleanDb, seedTutor, getAuthToken };
