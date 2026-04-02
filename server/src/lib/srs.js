const INTERVALS = [
  1 * 24 * 60,   // streak 0->1: +1 day (in minutes)
  3 * 24 * 60,   // streak 1->2: +3 days
  7 * 24 * 60,   // streak 2->3: +7 days
];
const WRONG_INTERVAL = 10; // minutes

export function getNextDueAt(currentStreak, isCorrect, now = new Date()) {
  if (!isCorrect) {
    return new Date(now.getTime() + WRONG_INTERVAL * 60_000);
  }
  if (currentStreak >= 3) {
    return null; // graduated
  }
  const minutes = INTERVALS[currentStreak];
  return new Date(now.getTime() + minutes * 60_000);
}

export function buildSession(dueQuizzes, wrongQuizzes, unseenQuizzes) {
  const SESSION_SIZE = 5;
  const dueCount = dueQuizzes.length;

  let maxNew = 2;
  if (dueCount >= 20) maxNew = 0;
  else if (dueCount >= 10) maxNew = 1;

  const session = [];

  // 1. Add due quizzes (review)
  for (const q of dueQuizzes) {
    if (session.length >= SESSION_SIZE) break;
    session.push(q);
  }

  // 2. Add wrong quizzes
  for (const q of wrongQuizzes) {
    if (session.length >= SESSION_SIZE) break;
    if (!session.some(s => s.quiz_id === q.quiz_id)) {
      session.push(q);
    }
  }

  // 3. Add new (unseen) quizzes up to maxNew
  let newAdded = 0;
  for (const q of unseenQuizzes) {
    if (session.length >= SESSION_SIZE) break;
    if (newAdded >= maxNew) break;
    session.push(q);
    newAdded++;
  }

  // 4. Fill remaining with more from wrong/unseen
  if (session.length < SESSION_SIZE) {
    for (const q of [...wrongQuizzes, ...unseenQuizzes]) {
      if (session.length >= SESSION_SIZE) break;
      if (!session.some(s => s.quiz_id === q.quiz_id)) {
        session.push(q);
      }
    }
  }

  return session.slice(0, SESSION_SIZE);
}
