const OVERDUE_DAYS = 7;

function isOverdue(homework, session) {
  if (homework.status === 'CHECKED') return false;
  const now = new Date();
  if (homework.dueDate) return now > new Date(homework.dueDate);
  if (homework.status !== 'ASSIGNED') return false;
  const threshold = new Date(
    new Date(session.startTime).getTime() + OVERDUE_DAYS * 24 * 60 * 60 * 1000
  );
  return now > threshold;
}

module.exports = { isOverdue };
