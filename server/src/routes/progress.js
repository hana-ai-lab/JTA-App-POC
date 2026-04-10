import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// GET /api/progress
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT level, exp, streak_days FROM users WHERE id = $1',
      [userId]
    );

    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM quizzes');
    const completedResult = await pool.query(
      `SELECT COUNT(*)::int AS completed FROM user_quiz_progress
       WHERE user_id = $1 AND ever_correct = true`,
      [userId]
    );
    const masteredResult = await pool.query(
      `SELECT COUNT(*)::int AS mastered FROM user_quiz_progress
       WHERE user_id = $1 AND correct_streak >= 4`,
      [userId]
    );

    // Today's due quizzes (SRS review scheduled for today)
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const todayDueResult = await pool.query(
      `SELECT COUNT(*)::int AS due FROM user_quiz_progress
       WHERE user_id = $1 AND next_due_at <= $2 AND correct_streak < 4`,
      [userId, endOfDay]
    );

    // Today's activity (quizzes answered today + XP earned today)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayExpResult = await pool.query(
      `SELECT COALESCE(SUM(exp_change), 0)::int AS exp, COUNT(*)::int AS actions
       FROM exp_history WHERE user_id = $1 AND created_at >= $2`,
      [userId, startOfDay]
    );

    const user = userResult.rows[0];
    res.json({
      level: user.level,
      exp: user.exp,
      expToNext: 100 - (user.exp % 100),
      streakDays: user.streak_days,
      totalQuizzes: totalResult.rows[0].total,
      completedQuizzes: completedResult.rows[0].completed,
      masteredQuizzes: masteredResult.rows[0].mastered,
      todayDue: todayDueResult.rows[0].due,
      todayExp: todayExpResult.rows[0].exp,
      todayQuizzes: todayExpResult.rows[0].actions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/progress/exp-history
router.get('/exp-history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DATE(created_at) AS date, SUM(exp_change)::int AS exp
       FROM exp_history
       WHERE user_id = $1
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [userId]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
