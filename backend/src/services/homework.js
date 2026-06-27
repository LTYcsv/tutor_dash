const OVERDUE_DAYS = 7;

function isOverdue(homework, session) {
  if (homework.status !== 'ASSIGNED') return false;
  const threshold = new Date(
    new Date(session.startTime).getTime() + OVERDUE_DAYS * 24 * 60 * 60 * 1000
  );
  return new Date() > threshold;
}

module.exports = { isOverdue };
