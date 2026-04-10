import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';
import { buildSession, getNextDueAt } from '../lib/srs.js';
import { calcXpGain, calcLevel } from '../lib/xp.js';

const router = Router();

// GET /api/quiz/session
router.get('/session', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const planType = req.user.planType;
    const now = new Date();

    const planFilter = planType === 'light'
      ? 'AND q.available_for_light = true'
      : '';

    const chapterId = req.query.chapterId ? parseInt(req.query.chapterId, 10) : null;

    let quizzes;

    if (chapterId) {
      // Chapter review mode: return all quizzes in the chapter (including mastered),
      // ordered by lowest streak first (wrong/unseen → due → mastered)
      const result = await pool.query(
        `SELECT q.id as quiz_id, q.*,
           COALESCE(p.correct_streak, 0) AS correct_streak
         FROM quizzes q
         LEFT JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
         WHERE q.chapter_id = $2 ${planFilter}
         ORDER BY COALESCE(p.correct_streak, 0) ASC, q.sort_order ASC`,
        [userId, chapterId]
      );
      quizzes = result.rows.map(({ correct_answer, quiz_id, ...rest }) => rest);
    } else {
      // Home mode: SRS session (due → wrong → unseen, capped at SESSION_SIZE)
      // 1. Due quizzes
      const dueResult = await pool.query(
        `SELECT q.id as quiz_id, q.* FROM quizzes q
         JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
         WHERE p.next_due_at <= $2 AND p.correct_streak < 4
         ${planFilter}
         ORDER BY p.next_due_at ASC`,
        [userId, now]
      );

      // 2. Wrong quizzes
      const wrongResult = await pool.query(
        `SELECT q.id as quiz_id, q.* FROM quizzes q
         JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
         WHERE p.correct_streak = 0 AND p.seen = true
         AND (p.next_due_at IS NULL OR p.next_due_at > $2)
         ${planFilter}`,
        [userId, now]
      );

      // 3. Unseen quizzes
      const unseenResult = await pool.query(
        `SELECT q.id as quiz_id, q.* FROM quizzes q
         WHERE q.id NOT IN (
           SELECT quiz_id FROM user_quiz_progress WHERE user_id = $1
         )
         ${planFilter}
         ORDER BY q.chapter_id, q.sort_order`,
        [userId]
      );

      const session = buildSession(dueResult.rows, wrongResult.rows, unseenResult.rows);
      quizzes = session.map(({ correct_answer, quiz_id, ...rest }) => rest);
    }

    res.json({ quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quiz/answer
router.post('/answer', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, answer } = req.body;
    const now = new Date();

    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const quiz = quizResult.rows[0];
    const isCorrect = quiz.correct_answer === answer;

    const progressResult = await pool.query(
      'SELECT * FROM user_quiz_progress WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );

    const currentStreak = progressResult.rows.length > 0 ? progressResult.rows[0].correct_streak : 0;
    const wasSeen = progressResult.rows.length > 0;
    const isReview = wasSeen;

    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const nextDueAt = getNextDueAt(currentStreak, isCorrect, now);

    await pool.query(
      `INSERT INTO user_quiz_progress (user_id, quiz_id, correct_streak, next_due_at, seen, ever_correct)
       VALUES ($1, $2, $3, $4, true, $5)
       ON CONFLICT (user_id, quiz_id)
       DO UPDATE SET correct_streak = $3, next_due_at = $4, seen = true,
         ever_correct = user_quiz_progress.ever_correct OR $5`,
      [userId, quizId, newStreak, nextDueAt, isCorrect]
    );

    // XP
    const xpGained = calcXpGain(isCorrect, isReview);
    if (xpGained > 0) {
      await pool.query('UPDATE users SET exp = exp + $1 WHERE id = $2', [xpGained, userId]);
      await pool.query(
        'INSERT INTO exp_history (user_id, exp_change) VALUES ($1, $2)',
        [userId, xpGained]
      );
      const userResult = await pool.query('SELECT exp FROM users WHERE id = $1', [userId]);
      const newLevel = calcLevel(userResult.rows[0].exp);
      await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);
    }

    // Streak tracking - read last_played_at BEFORE updating
    const userRow = await pool.query('SELECT last_played_at, streak_days FROM users WHERE id = $1', [userId]);
    const lastPlayed = userRow.rows[0].last_played_at;
    const today = new Date(now.toDateString());

    if (lastPlayed) {
      const lastDate = new Date(new Date(lastPlayed).toDateString());
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        await pool.query('UPDATE users SET streak_days = streak_days + 1 WHERE id = $1', [userId]);
      } else if (diffDays > 1) {
        await pool.query('UPDATE users SET streak_days = 1 WHERE id = $1', [userId]);
      }
    } else {
      await pool.query('UPDATE users SET streak_days = 1 WHERE id = $1', [userId]);
    }

    await pool.query('UPDATE users SET last_played_at = $1 WHERE id = $2', [now, userId]);

    // Chapter mastery bonus
    let chapterMastered = false;
    const chapterQuizzes = await pool.query(
      'SELECT id FROM quizzes WHERE chapter_id = $1',
      [quiz.chapter_id]
    );
    const chapterProgress = await pool.query(
      `SELECT quiz_id FROM user_quiz_progress
       WHERE user_id = $1 AND quiz_id = ANY($2) AND correct_streak >= 4`,
      [userId, chapterQuizzes.rows.map(q => q.id)]
    );
    if (chapterProgress.rows.length === chapterQuizzes.rows.length && chapterQuizzes.rows.length > 0) {
      chapterMastered = true;
      await pool.query('UPDATE users SET exp = exp + 50 WHERE id = $1', [userId]);
      await pool.query(
        'INSERT INTO exp_history (user_id, exp_change) VALUES ($1, 50)',
        [userId]
      );
    }

    res.json({
      correct: isCorrect,
      correctAnswer: quiz.correct_answer,
      explanation: quiz.explanation || null,
      xpGained: xpGained + (chapterMastered ? 50 : 0),
      chapterMastered,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
