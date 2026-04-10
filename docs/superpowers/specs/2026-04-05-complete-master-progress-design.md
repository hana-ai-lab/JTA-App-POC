# Complete & Master Progress Design

## Overview

Add dual progress tracking to the JTA quiz app: **Complete** (1+ correct answers, `correct_streak >= 1`) and **Master** (SRS graduated, `correct_streak >= 4`). No DB migration needed — both states already exist in `user_quiz_progress`.

## Backend Changes

### `GET /api/chapters`
Add `completed` count alongside existing `mastered`:
```sql
COUNT(CASE WHEN p.correct_streak >= 1 THEN 1 END)::int AS completed
COUNT(CASE WHEN p.correct_streak >= 4 THEN 1 END)::int AS mastered
```

### `GET /api/progress`
Change `completedQuizzes` query from `seen = true` to `correct_streak >= 1`:
```sql
SELECT COUNT(*)::int AS completed FROM user_quiz_progress
WHERE user_id = $1 AND correct_streak >= 1
```
`masteredQuizzes` stays as-is (`correct_streak >= 4`).

## Frontend Changes

### Chapter Card — Segment Bar
Replace current `ChapterProgress` with a 3-segment bar:
- Gray = untouched
- Indigo (primary color) = completed but not mastered
- Gold = mastered

Bar shows: `[gold | indigo | gray]` with master count label.
When all quizzes mastered: full gold bar + `MASTER` badge.

### Home — stat-grid
Replace current 2-item grid:
- Left: Total XP (unchanged)
- Right: Two-line display
  - `85/480 コンプリート`
  - `14/480 マスター`

### Dummy Data
Add `completed` field to `DUMMY_CHAPTERS` (>= mastered value).
Update `DUMMY_PROGRESS` if needed.

## SRS Reference
Existing intervals (no changes):
- Wrong: retry in 10 min
- Streak 0→1: +1 day
- Streak 1→2: +3 days
- Streak 2→3: +7 days
- Streak 4: graduated (Master)
- Minimum time to Master: ~11 days
