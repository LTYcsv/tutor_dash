const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE "Note", "Payment", "Homework", "Topic", "Session", "StudentSubject", "Student", "Tutor" CASCADE`;

  const passwordHash = await bcrypt.hash('password123', 12);
  const tutor = await prisma.tutor.create({
    data: { name: 'Репетитор', email: 'tutor@tutordesk.ru', passwordHash, ratePerHour: 1500, timezone: 'Europe/Moscow' }
  });

  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'Максим Котов', initials: 'МК', color: '#4F46E5', phone: '+7 916 111 22 33',
        subjects: { create: { subject: 'Математика', level: 'B2' } }
      },
      include: { subjects: true }
    }),
    prisma.student.create({
      data: {
        name: 'Анна Смирнова', initials: 'АС', color: '#10B981', phone: '+7 925 444 55 66',
        subjects: { create: { subject: 'Английский', level: 'B1' } }
      },
      include: { subjects: true }
    }),
    prisma.student.create({
      data: {
        name: 'Иван Петров', initials: 'ИП', color: '#F59E0B', phone: '+7 903 777 88 99',
        subjects: { create: { subject: 'Физика', level: 'A2' } }
      },
      include: { subjects: true }
    })
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const student of students) {
    const subjectId = student.subjects[0].id;

    await prisma.session.createMany({
      data: [
        { studentSubjectId: subjectId, startTime: new Date(today.getTime() + 10 * 3600000), durationMin: 60, status: 'CONFIRMED' },
        { studentSubjectId: subjectId, startTime: new Date(today.getTime() - 7 * 24 * 3600000), durationMin: 60, status: 'COMPLETED' }
      ]
    });

    await prisma.payment.create({
      data: { studentId: student.id, amount: 3000, method: 'CARD', status: 'PAID', dueDate: new Date(today.getFullYear(), today.getMonth(), 1) }
    });
    await prisma.payment.create({
      data: { studentId: student.id, amount: 3000, method: 'CARD', status: 'PENDING', dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) }
    });

    await prisma.topic.createMany({
      data: [
        { studentSubjectId: subjectId, title: 'Тема 1', sortOrder: 0, completed: true },
        { studentSubjectId: subjectId, title: 'Тема 2', sortOrder: 1 }
      ]
    });

    await prisma.note.create({ data: { studentId: student.id, content: 'Хорошо усваивает материал' } });
  }

  console.log(`Seed complete. Login: tutor@tutordesk.ru / password123`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
