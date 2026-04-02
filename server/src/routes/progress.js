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
    const masteredResult = await pool.query(
      `SELECT COUNT(*)::int AS mastered FROM user_quiz_progress
       WHERE user_id = $1 AND correct_streak >= 4`,
      [userId]
    );

    const user = userResult.rows[0];
    res.json({
      level: user.level,
      exp: user.exp,
      expToNext: 100 - (user.exp % 100),
      streakDays: user.streak_days,
      totalQuizzes: totalResult.rows[0].total,
      masteredQuizzes: masteredResult.rows[0].mastered,
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
