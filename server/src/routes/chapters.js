import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// GET /api/chapters
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const planType = req.user.planType;

    const planFilter = planType === 'light'
      ? 'AND q.available_for_light = true'
      : '';

    const result = await pool.query(
      `SELECT c.id, c.title, c.sort_order,
              COUNT(q.id)::int AS total_quizzes,
              COUNT(CASE WHEN p.correct_streak >= 4 THEN 1 END)::int AS mastered
       FROM chapters c
       LEFT JOIN quizzes q ON q.chapter_id = c.id ${planFilter}
       LEFT JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
       GROUP BY c.id
       ORDER BY c.sort_order`,
      [userId]
    );

    res.json({ chapters: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
