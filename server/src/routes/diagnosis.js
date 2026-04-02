import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// GET /api/diagnosis/quizzes
router.get('/quizzes', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, question, choice_1, choice_2, choice_3, choice_4 FROM diagnosis_quizzes ORDER BY id'
    );
    res.json({ quizzes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/diagnosis/submit
router.post('/submit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;

    const quizIds = answers.map(a => a.quizId);
    const quizzesResult = await pool.query(
      'SELECT id, correct_answer FROM diagnosis_quizzes WHERE id = ANY($1)',
      [quizIds]
    );
    const quizMap = Object.fromEntries(quizzesResult.rows.map(q => [q.id, q.correct_answer]));

    let correctCount = 0;
    for (const { quizId, answer } of answers) {
      if (quizMap[quizId] === answer) correctCount++;
    }

    const totalCount = answers.length;
    const ratio = totalCount > 0 ? correctCount / totalCount : 0;
    const threshold = parseFloat(process.env.DIAGNOSIS_THRESHOLD || '0.6');
    const shouldSkip = ratio >= threshold;

    if (shouldSkip) {
      const lightQuizzes = await pool.query(
        'SELECT id FROM quizzes WHERE available_for_light = true'
      );
      for (const q of lightQuizzes.rows) {
        await pool.query(
          `INSERT INTO user_quiz_progress (user_id, quiz_id, correct_streak, seen)
           VALUES ($1, $2, 4, true)
           ON CONFLICT (user_id, quiz_id)
           DO UPDATE SET correct_streak = 4`,
          [userId, q.id]
        );
      }
      await pool.query(
        'UPDATE users SET diagnosis_skipped_light = true WHERE id = $1',
        [userId]
      );
    }

    await pool.query(
      'UPDATE users SET diagnosis_completed = true WHERE id = $1',
      [userId]
    );

    res.json({
      correctCount,
      totalCount,
      ratio,
      skippedLight: shouldSkip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
