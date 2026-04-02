import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const { fincsToken } = req.body;
    if (!fincsToken) {
      return res.status(400).json({ error: 'Missing fincsToken' });
    }

    // TODO: In production, verify fincsToken against FINCS public key
    // For now, decode without verification for development
    let fincsPayload;
    try {
      fincsPayload = jwt.decode(fincsToken);
    } catch {
      return res.status(401).json({ error: 'Invalid FINCS token' });
    }

    if (!fincsPayload || !fincsPayload.sub || !fincsPayload.plan_type) {
      return res.status(401).json({ error: 'Invalid FINCS token payload' });
    }

    const fincsUserId = fincsPayload.sub;
    const planType = fincsPayload.plan_type;

    // Upsert user
    const result = await pool.query(
      `INSERT INTO users (fincs_user_id, plan_type)
       VALUES ($1, $2)
       ON CONFLICT (fincs_user_id)
       DO UPDATE SET plan_type = $2
       RETURNING id, fincs_user_id, plan_type, level, exp, streak_days, diagnosis_completed, diagnosis_skipped_light`,
      [fincsUserId, planType]
    );

    const user = result.rows[0];

    // Issue app JWT
    const token = jwt.sign(
      { userId: user.id, fincsUserId: user.fincs_user_id, planType: user.plan_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
