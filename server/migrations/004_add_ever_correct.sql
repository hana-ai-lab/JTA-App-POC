ALTER TABLE user_quiz_progress
  ADD COLUMN IF NOT EXISTS ever_correct BOOLEAN DEFAULT FALSE;

-- Backfill: mark as ever_correct if they currently have a streak >= 1
UPDATE user_quiz_progress SET ever_correct = TRUE WHERE correct_streak >= 1;
