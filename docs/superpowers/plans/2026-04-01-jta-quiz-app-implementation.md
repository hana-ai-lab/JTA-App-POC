# JTA Quiz App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack investment quiz app with SRS (spaced repetition), FINCS auth, XP/leveling, and diagnosis quiz flow.

**Architecture:** Monorepo with `client/` (React 18 + Vite) and `server/` (Express.js). PostgreSQL for persistence. FINCS JWT for auth. Docker Compose for local dev and deployment.

**Tech Stack:** React 18, Vite, Express.js, PostgreSQL 15, JWT, Docker Compose, Cloudflare Tunnel

**Spec:** `docs/superpowers/specs/2026-04-01-jta-quiz-app-design.md`

---

## File Structure

```
jta-app/
├── docker-compose.yml
├── .env.example
├── package.json                    # Root workspace config
│
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js                # Express entry point
│   │   ├── db.js                   # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /api/auth/verify
│   │   │   ├── quiz.js             # GET /api/quiz/session, POST /api/quiz/answer
│   │   │   ├── chapters.js         # GET /api/chapters
│   │   │   ├── diagnosis.js        # GET /api/diagnosis/quizzes, POST /api/diagnosis/submit
│   │   │   ├── progress.js         # GET /api/progress, GET /api/progress/exp-history
│   │   │   └── user.js             # GET /api/user/me
│   │   └── lib/
│   │       ├── srs.js              # SRS logic (session generation, answer processing)
│   │       └── xp.js               # XP calculation & level-up
│   ├── migrations/
│   │   └── 001_initial.sql         # All tables
│   ├── seeds/
│   │   └── 001_quiz_data.sql       # 20 initial quizzes + chapters + diagnosis quizzes
│   └── tests/
│       ├── srs.test.js
│       ├── xp.test.js
│       ├── routes/
│       │   ├── auth.test.js
│       │   ├── quiz.test.js
│       │   ├── chapters.test.js
│       │   ├── diagnosis.test.js
│       │   ├── progress.test.js
│       │   └── user.test.js
│       └── setup.js                # Test DB setup/teardown
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                # React entry
│       ├── App.jsx                 # Router
│       ├── api/
│       │   └── client.js           # Fetch wrapper with JWT
│       ├── hooks/
│       │   ├── useAuth.js          # Auth state + FINCS redirect
│       │   └── useQuiz.js          # Quiz session state
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Quiz.jsx
│       │   ├── Chapters.jsx
│       │   ├── ChapterQuiz.jsx
│       │   ├── Progress.jsx
│       │   └── Diagnosis.jsx
│       ├── components/
│       │   ├── QuizCard.jsx
│       │   ├── ProgressBar.jsx
│       │   ├── ExpChart.jsx
│       │   └── Header.jsx
│       └── index.css               # Global styles (white + indigo theme)
│
├── client/nginx.conf               # Nginx config for production Docker build
│
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-04-01-jta-quiz-app-design.md
        └── plans/
            └── 2026-04-01-jta-quiz-app-implementation.md
```

---

## Task 1: Project Scaffolding & Docker Compose

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json` with workspaces**

```json
{
  "name": "jta-app",
  "private": true,
  "workspaces": ["server", "client"]
}
```

- [ ] **Step 2: Create `server/package.json`**

```json
{
  "name": "jta-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "test": "node --test tests/**/*.test.js",
    "migrate": "node src/migrate.js",
    "seed": "node src/seed.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "pg": "^8.13.0",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {}
}
```

- [ ] **Step 3: Create `client/package.json`**

```json
{
  "name": "jta-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jta
      POSTGRES_USER: jta
      POSTGRES_PASSWORD: jta_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 5: Create `.env.example`**

```
DATABASE_URL=postgres://jta:jta_dev@localhost:5432/jta
FINCS_JWKS_URI=https://fincs.example.com/.well-known/jwks.json
FINCS_ISSUER=https://fincs.example.com
JWT_SECRET=dev-secret-change-in-production
PORT=3001
DIAGNOSIS_THRESHOLD=0.6
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.env
*.log
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`

- [ ] **Step 8: Start DB and verify**

Run: `docker compose up -d db`
Run: `docker compose exec db psql -U jta -c '\l'`
Expected: `jta` database in listing

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: project scaffolding with workspaces and Docker Compose"
```

---

## Task 2: Database Migration

**Files:**
- Create: `server/migrations/001_initial.sql`
- Create: `server/src/db.js`
- Create: `server/src/migrate.js`

- [ ] **Step 1: Create `server/src/db.js`**

```js
import pg from 'pg';

// Note: dotenv is loaded once in index.js (or migrate.js/seed.js) before this module.

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

- [ ] **Step 2: Create `server/migrations/001_initial.sql`**

```sql
CREATE TABLE users (
  id                        SERIAL PRIMARY KEY,
  fincs_user_id             VARCHAR(255) UNIQUE NOT NULL,
  plan_type                 VARCHAR(50) NOT NULL,
  level                     INT DEFAULT 1,
  exp                       INT DEFAULT 0,
  streak_days               INT DEFAULT 0,
  last_played_at            TIMESTAMP,
  diagnosis_completed       BOOLEAN DEFAULT FALSE,
  diagnosis_skipped_light   BOOLEAN DEFAULT FALSE
);

CREATE TABLE chapters (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL
);

CREATE TABLE quizzes (
  id                  SERIAL PRIMARY KEY,
  chapter_id          INT REFERENCES chapters(id),
  question            TEXT NOT NULL,
  choice_1            VARCHAR(500) NOT NULL,
  choice_2            VARCHAR(500) NOT NULL,
  choice_3            VARCHAR(500) NOT NULL,
  choice_4            VARCHAR(500) NOT NULL,
  correct_answer      INT NOT NULL CHECK (correct_answer BETWEEN 1 AND 4),
  available_for_light BOOLEAN DEFAULT FALSE,
  sort_order          INT NOT NULL
);

CREATE TABLE diagnosis_quizzes (
  id             SERIAL PRIMARY KEY,
  question       TEXT NOT NULL,
  choice_1       VARCHAR(500) NOT NULL,
  choice_2       VARCHAR(500) NOT NULL,
  choice_3       VARCHAR(500) NOT NULL,
  choice_4       VARCHAR(500) NOT NULL,
  correct_answer INT NOT NULL
);

CREATE TABLE user_quiz_progress (
  user_id        INT REFERENCES users(id),
  quiz_id        INT REFERENCES quizzes(id),
  correct_streak INT DEFAULT 0,
  next_due_at    TIMESTAMP,
  seen           BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, quiz_id)
);

-- Design decision: added id SERIAL PRIMARY KEY (not in spec) for standard row identification.
CREATE TABLE exp_history (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  exp_change INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for exp-history query performance (GROUP BY date, WHERE user_id)
CREATE INDEX idx_exp_history_user_date ON exp_history (user_id, created_at);
```

- [ ] **Step 3: Create `server/src/migrate.js`**

```js
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, '../migrations/001_initial.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Create `.env` from example and run migration**

Run: `cp .env.example .env`
Run: `cd server && node src/migrate.js`
Expected: "Migration complete"

- [ ] **Step 5: Verify tables exist**

Run: `docker compose exec db psql -U jta -c '\dt'`
Expected: 6 tables listed (users, chapters, quizzes, diagnosis_quizzes, user_quiz_progress, exp_history)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: database schema migration"
```

---

## Task 3: Seed Data (20 Quizzes)

**Files:**
- Create: `server/seeds/001_quiz_data.sql`
- Create: `server/src/seed.js`

**Reference:** Parse quizzes from `/Users/neil/Desktop/dev/apps/quiz-app/docs/quizzes.md`

- [ ] **Step 1: Create seed SQL with chapters and quizzes**

Extract the first 4 chapters (5 quizzes each = 20 quizzes) from `quizzes.md`. The markdown format uses `**[Q_BEG_X_Y]` for question IDs. The correct answer is marked with `✅`.

Create `server/seeds/001_quiz_data.sql`:

```sql
-- Chapters
INSERT INTO chapters (id, title, sort_order) VALUES
  (1, 'トレードの仕組みと学習ロードマップ', 1),
  (2, '証券口座とチャート分析ツールの準備', 2),
  (3, '注文の三種の神器：成行・指値・逆指値', 3),
  (4, 'ローソク足の基本：1本が語る物語', 4);

-- First 5 quizzes are available_for_light (used for diagnosis skip)
-- Parse each quiz from quizzes.md: question, 4 choices, correct_answer (1-4)
-- INSERT INTO quizzes (chapter_id, question, choice_1, choice_2, choice_3, choice_4, correct_answer, available_for_light, sort_order)
-- VALUES (...);
-- (Agent implementing this task: read quizzes.md and extract actual quiz content)

-- Diagnosis quizzes (5 questions covering basics)
-- INSERT INTO diagnosis_quizzes (question, choice_1, choice_2, choice_3, choice_4, correct_answer)
-- VALUES (...);
-- (Agent: select 5 representative questions that test basic knowledge)
```

**Note to implementing agent:** Read `/Users/neil/Desktop/dev/apps/quiz-app/docs/quizzes.md`, parse the first 20 quizzes (Stages 1-4), and generate the full INSERT statements. Mark the first chapter's quizzes as `available_for_light = true`. Create 5 diagnosis quizzes from a representative cross-section.

- [ ] **Step 2: Create `server/src/seed.js`**

```js
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const sql = readFileSync(join(__dirname, '../seeds/001_quiz_data.sql'), 'utf8');
  await pool.query(sql);
  console.log('Seed complete');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 3: Run seed**

Run: `cd server && node src/seed.js`
Expected: "Seed complete"

- [ ] **Step 4: Verify data**

Run: `docker compose exec db psql -U jta -c 'SELECT count(*) FROM quizzes;'`
Expected: `20`

Run: `docker compose exec db psql -U jta -c 'SELECT count(*) FROM chapters;'`
Expected: `4`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: seed quiz data (20 quizzes, 4 chapters)"
```

---

## Task 4: SRS Logic (Pure Functions)

**Files:**
- Create: `server/src/lib/srs.js`
- Create: `server/tests/srs.test.js`

- [ ] **Step 1: Write failing tests for `getNextDueAt`**

Create `server/tests/srs.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNextDueAt, buildSession } from '../src/lib/srs.js';

describe('getNextDueAt', () => {
  const now = new Date('2026-04-01T12:00:00Z');

  it('returns +1 day for streak 0->1', () => {
    const result = getNextDueAt(0, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-02T12:00:00Z'));
  });

  it('returns +3 days for streak 1->2', () => {
    const result = getNextDueAt(1, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-04T12:00:00Z'));
  });

  it('returns +7 days for streak 2->3', () => {
    const result = getNextDueAt(2, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-08T12:00:00Z'));
  });

  it('returns null (graduated) for streak 3->4', () => {
    const result = getNextDueAt(3, true, now);
    assert.strictEqual(result, null);
  });

  it('returns +10 min for incorrect answer', () => {
    const result = getNextDueAt(2, false, now);
    assert.deepStrictEqual(result, new Date('2026-04-01T12:10:00Z'));
  });
});

describe('buildSession', () => {
  it('returns up to 5 quizzes', () => {
    const dueQuizzes = Array.from({ length: 8 }, (_, i) => ({ quiz_id: i + 1 }));
    const wrongQuizzes = [];
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, wrongQuizzes, unseenQuizzes);
    assert.strictEqual(session.length, 5);
  });

  it('includes 0 new quizzes when due >= 20', () => {
    const dueQuizzes = Array.from({ length: 25 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.strictEqual(newIds.length, 0);
  });

  it('includes max 1 new quiz when due >= 10', () => {
    const dueQuizzes = Array.from({ length: 12 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.ok(newIds.length <= 1);
  });

  it('includes max 2 new quizzes when due < 10', () => {
    const dueQuizzes = Array.from({ length: 3 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.ok(newIds.length <= 2);
  });

  it('prioritizes wrong quizzes over unseen', () => {
    const dueQuizzes = [];
    const wrongQuizzes = [{ quiz_id: 50 }];
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, wrongQuizzes, unseenQuizzes);
    assert.ok(session.some(q => q.quiz_id === 50));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/srs.test.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `server/src/lib/srs.js`**

```js
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

  // 4. Fill remaining with more due quizzes (already added above, so pad from wrong/unseen)
  // If still not full, add more from any available pool
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test tests/srs.test.js`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: SRS logic with spaced repetition intervals"
```

---

## Task 5: XP Logic (Pure Functions)

**Files:**
- Create: `server/src/lib/xp.js`
- Create: `server/tests/xp.test.js`

- [ ] **Step 1: Write failing tests**

Create `server/tests/xp.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcXpGain, calcLevel } from '../src/lib/xp.js';

describe('calcXpGain', () => {
  it('returns 10 for new quiz correct', () => {
    assert.strictEqual(calcXpGain(true, false), 10);
  });

  it('returns 5 for review quiz correct', () => {
    assert.strictEqual(calcXpGain(true, true), 5);
  });

  it('returns 0 for incorrect', () => {
    assert.strictEqual(calcXpGain(false, false), 0);
    assert.strictEqual(calcXpGain(false, true), 0);
  });
});

describe('calcLevel', () => {
  it('returns level 1 for 0 xp', () => {
    assert.strictEqual(calcLevel(0), 1);
  });

  it('returns level 1 for 99 xp', () => {
    assert.strictEqual(calcLevel(99), 1);
  });

  it('returns level 2 for 100 xp', () => {
    assert.strictEqual(calcLevel(100), 2);
  });

  it('returns level 11 for 1000 xp', () => {
    assert.strictEqual(calcLevel(1000), 11);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/xp.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `server/src/lib/xp.js`**

```js
export function calcXpGain(isCorrect, isReview) {
  if (!isCorrect) return 0;
  return isReview ? 5 : 10;
}

export function calcLevel(exp) {
  return Math.floor(exp / 100) + 1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test tests/xp.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: XP and level calculation"
```

---

## Task 6: Express Server & Auth Middleware

**Files:**
- Create: `server/src/index.js`
- Create: `server/src/middleware/auth.js`
- Create: `server/src/routes/auth.js`
- Create: `server/tests/setup.js`
- Create: `server/tests/routes/auth.test.js`

- [ ] **Step 1: Create `server/src/index.js`**

```js
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Load env FIRST, before other imports use process.env

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import chapterRoutes from './routes/chapters.js';
import diagnosisRoutes from './routes/diagnosis.js';
import progressRoutes from './routes/progress.js';
import userRoutes from './routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
```

**Note:** Route files for quiz, chapters, diagnosis, progress, user will be created as stubs in this step and implemented in later tasks.

- [ ] **Step 2: Create route stubs**

Create empty router stubs for: `server/src/routes/quiz.js`, `server/src/routes/chapters.js`, `server/src/routes/diagnosis.js`, `server/src/routes/progress.js`, `server/src/routes/user.js`

Each stub:
```js
import { Router } from 'express';
const router = Router();
export default router;
```

- [ ] **Step 3: Create `server/src/middleware/auth.js`**

```js
import jwt from 'jsonwebtoken';

// Note: dotenv is loaded once in index.js before all imports.
// Do NOT call dotenv.config() in individual modules.

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, fincsUserId: payload.fincsUserId, planType: payload.planType };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 4: Create `server/src/routes/auth.js`**

```js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

// POST /api/auth/verify
// Body: { fincsToken: string }
// In production, verify against FINCS JWKS. For now, decode and trust.
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
```

- [ ] **Step 5: Create `server/tests/setup.js`**

```js
import jwt from 'jsonwebtoken';
import pool from '../src/db.js';

export async function resetDb() {
  await pool.query('DELETE FROM exp_history');
  await pool.query('DELETE FROM user_quiz_progress');
  await pool.query('DELETE FROM users');
}

export async function createTestUser(overrides = {}) {
  const defaults = { fincs_user_id: 'test-user-1', plan_type: 'basic' };
  const { fincs_user_id, plan_type } = { ...defaults, ...overrides };
  const result = await pool.query(
    'INSERT INTO users (fincs_user_id, plan_type) VALUES ($1, $2) RETURNING *',
    [fincs_user_id, plan_type]
  );
  return result.rows[0];
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, fincsUserId: user.fincs_user_id, planType: user.plan_type },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export { default as pool } from '../src/db.js';
```

- [ ] **Step 6: Write auth route test**

Create `server/tests/routes/auth.test.js`:

```js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { resetDb, pool } from '../setup.js';

// Import app for direct handler testing
import app from '../../src/index.js';

describe('POST /api/auth/verify', () => {
  before(async () => { await resetDb(); });
  after(async () => { await pool.end(); });

  it('creates a new user and returns JWT', async () => {
    const fincsToken = jwt.sign(
      { sub: 'fincs-user-123', plan_type: 'basic' },
      'fincs-secret' // not verified in dev
    );

    const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fincsToken }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.strictEqual(body.user.fincs_user_id, 'fincs-user-123');
    assert.strictEqual(body.user.plan_type, 'basic');
  });
});
```

- [ ] **Step 7: Start server and run test**

Run: `cd server && node src/index.js &`
Run: `cd server && node --test tests/routes/auth.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Express server with auth endpoint and JWT middleware"
```

---

## Task 7: Quiz API Routes

**Files:**
- Modify: `server/src/routes/quiz.js`
- Create: `server/tests/routes/quiz.test.js`

- [ ] **Step 1: Write failing test for GET /api/quiz/session**

Create `server/tests/routes/quiz.test.js`:

```js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, createTestUser, generateToken, pool } from '../setup.js';

describe('GET /api/quiz/session', () => {
  let token;

  before(async () => {
    await resetDb();
    const user = await createTestUser();
    token = generateToken(user);
  });

  after(async () => { await pool.end(); });

  it('returns up to 5 quizzes', async () => {
    const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/quiz/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.quizzes));
    assert.ok(body.quizzes.length <= 5);
    assert.ok(body.quizzes.length > 0);
    // Each quiz should have question and choices but NOT correct_answer
    const q = body.quizzes[0];
    assert.ok(q.question);
    assert.ok(q.choice_1);
    assert.strictEqual(q.correct_answer, undefined);
  });
});

describe('POST /api/quiz/answer', () => {
  let token, userId;

  before(async () => {
    await resetDb();
    const user = await createTestUser();
    userId = user.id;
    token = generateToken(user);
  });

  after(async () => { await pool.end(); });

  it('returns result and updates progress', async () => {
    // Get a quiz first
    const sessionRes = await fetch(`http://localhost:${process.env.PORT || 3001}/api/quiz/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { quizzes } = await sessionRes.json();
    const quizId = quizzes[0].id;

    // Submit answer
    const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/quiz/answer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quizId, answer: 1 }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok('correct' in body);
    assert.ok('correctAnswer' in body);
    assert.ok('xpGained' in body);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/routes/quiz.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `server/src/routes/quiz.js`**

```js
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

    // Get plan filter
    const planFilter = planType === 'light'
      ? 'AND q.available_for_light = true'
      : '';

    // 1. Due quizzes (review)
    const dueResult = await pool.query(
      `SELECT q.id as quiz_id, q.* FROM quizzes q
       JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
       WHERE p.next_due_at <= $2 AND p.correct_streak < 4
       ${planFilter}
       ORDER BY p.next_due_at ASC`,
      [userId, now]
    );

    // 2. Wrong quizzes (seen but streak = 0)
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

    // Strip correct_answer from response
    const quizzes = session.map(({ correct_answer, quiz_id, ...rest }) => rest);

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

    // Get quiz
    const quizResult = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const quiz = quizResult.rows[0];
    const isCorrect = quiz.correct_answer === answer;

    // Get current progress
    const progressResult = await pool.query(
      'SELECT * FROM user_quiz_progress WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );

    const currentStreak = progressResult.rows.length > 0 ? progressResult.rows[0].correct_streak : 0;
    const wasSeen = progressResult.rows.length > 0;
    const isReview = wasSeen;

    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const nextDueAt = getNextDueAt(currentStreak, isCorrect, now);

    // Upsert progress
    await pool.query(
      `INSERT INTO user_quiz_progress (user_id, quiz_id, correct_streak, next_due_at, seen)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, quiz_id)
       DO UPDATE SET correct_streak = $3, next_due_at = $4, seen = true`,
      [userId, quizId, newStreak, nextDueAt]
    );

    // XP
    const xpGained = calcXpGain(isCorrect, isReview);
    if (xpGained > 0) {
      await pool.query('UPDATE users SET exp = exp + $1 WHERE id = $2', [xpGained, userId]);
      await pool.query(
        'INSERT INTO exp_history (user_id, exp_change) VALUES ($1, $2)',
        [userId, xpGained]
      );

      // Update level
      const userResult = await pool.query('SELECT exp FROM users WHERE id = $1', [userId]);
      const newLevel = calcLevel(userResult.rows[0].exp);
      await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);
    }

    // Update last_played_at and streak
    await pool.query(
      'UPDATE users SET last_played_at = $1 WHERE id = $2',
      [now, userId]
    );

    // Check chapter mastery bonus
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
      xpGained: xpGained + (chapterMastered ? 50 : 0),
      chapterMastered,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test tests/routes/quiz.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: quiz session and answer API with SRS integration"
```

---

## Task 8: Chapters, Progress, User, Diagnosis Routes

**Files:**
- Modify: `server/src/routes/chapters.js`
- Modify: `server/src/routes/progress.js`
- Modify: `server/src/routes/user.js`
- Modify: `server/src/routes/diagnosis.js`
- Create: `server/tests/routes/chapters.test.js`
- Create: `server/tests/routes/progress.test.js`
- Create: `server/tests/routes/diagnosis.test.js`

- [ ] **Step 1: Write failing test for GET /api/chapters**

Create `server/tests/routes/chapters.test.js` - test that chapters are returned with quiz counts and per-chapter progress for the authenticated user.

- [ ] **Step 2: Implement `server/src/routes/chapters.js`**

```js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// GET /api/chapters
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const planType = req.user.planType;

    // Light plan users only see available_for_light quizzes
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
```

- [ ] **Step 3: Run test, verify pass**

Run: `cd server && node --test tests/routes/chapters.test.js`
Expected: PASS

- [ ] **Step 4: Implement `server/src/routes/progress.js`**

```js
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
```

- [ ] **Step 5: Implement `server/src/routes/user.js`**

```js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// GET /api/user/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, fincs_user_id, plan_type, level, exp, streak_days,
              last_played_at, diagnosis_completed, diagnosis_skipped_light
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

- [ ] **Step 6: Implement `server/src/routes/diagnosis.js`**

```js
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
// Body: { answers: [{ quizId: number, answer: number }] }
router.post('/submit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;

    // Score the answers
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
    // Design decision: threshold not specified in spec, using 60% as default.
    // Can be adjusted via env var DIAGNOSIS_THRESHOLD if needed.
    const threshold = parseFloat(process.env.DIAGNOSIS_THRESHOLD || '0.6');
    const shouldSkip = ratio >= threshold;

    // If shouldSkip, mark available_for_light quizzes as graduated
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
```

- [ ] **Step 7: Write and run tests for progress, diagnosis, and user**

Create `server/tests/routes/progress.test.js`, `server/tests/routes/diagnosis.test.js`, and `server/tests/routes/user.test.js` with basic integration tests. `user.test.js` should verify `GET /api/user/me` returns user data for an authenticated user and 401 without token.

- [ ] **Step 8: Run all server tests**

Run: `cd server && node --test tests/**/*.test.js`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: chapters, progress, user, diagnosis API routes"
```

---

## Task 9: Frontend Scaffolding

**Files:**
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/index.css`
- Create: `client/src/api/client.js`

- [ ] **Step 1: Create `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 2: Create `client/index.html`**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JTA Quiz</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 3: Create `client/src/index.css`**

```css
:root {
  --color-primary: #1B2A4A;
  --color-primary-light: #2D4470;
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F7FA;
  --color-text: #1B2A4A;
  --color-text-muted: #6B7B8D;
  --color-success: #22C55E;
  --color-error: #EF4444;
  --color-border: #E2E8F0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  max-width: 480px;
  margin: 0 auto;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  padding: 12px 24px;
  transition: opacity 0.2s;
}

button:active {
  opacity: 0.8;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-choice {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border: 2px solid var(--color-border);
  margin-bottom: 8px;
}

.btn-choice.selected {
  border-color: var(--color-primary);
  background: #EEF2FF;
}

.btn-choice.correct {
  border-color: var(--color-success);
  background: #F0FDF4;
}

.btn-choice.wrong {
  border-color: var(--color-error);
  background: #FEF2F2;
}
```

- [ ] **Step 4: Create `client/src/api/client.js`**

```js
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('jta_token');
}

export function setToken(token) {
  localStorage.setItem('jta_token', token);
}

export function clearToken() {
  localStorage.removeItem('jta_token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}
```

- [ ] **Step 5: Create `client/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create `client/src/App.jsx` with routing stubs**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Chapters from './pages/Chapters.jsx';
import ChapterQuiz from './pages/ChapterQuiz.jsx';
import Progress from './pages/Progress.jsx';
import Diagnosis from './pages/Diagnosis.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (!user) {
    // Redirect to FINCS login
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <p>JTA Quiz App</p>
      <button className="btn-primary" onClick={() => {/* TODO: FINCS redirect */}}>
        ログイン
      </button>
    </div>;
  }

  // Check if diagnosis needed
  if (user.plan_type !== 'light' && !user.diagnosis_completed) {
    return <BrowserRouter>
      <Routes>
        <Route path="*" element={<Diagnosis />} />
      </Routes>
    </BrowserRouter>;
  }

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/chapters" element={<Chapters />} />
        <Route path="/chapters/:id" element={<ChapterQuiz />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Create `client/src/hooks/useAuth.js`**

```jsx
import { useState, useEffect } from 'react';
import { apiFetch, setToken, clearToken } from '../api/client.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jta_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/user/me')
      .then(data => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(fincsToken) {
    const data = await apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ fincsToken }),
    });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return { user, loading, login, logout };
}
```

- [ ] **Step 8: Create page and component stubs**

Create minimal stub files for all pages and components (Home.jsx, Quiz.jsx, Chapters.jsx, ChapterQuiz.jsx, Progress.jsx, Diagnosis.jsx, QuizCard.jsx, ProgressBar.jsx, ExpChart.jsx, Header.jsx) that each export a simple placeholder div.

- [ ] **Step 9: Verify frontend starts**

Run: `cd client && npm run dev`
Expected: Vite dev server on http://localhost:5173, no build errors

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: frontend scaffolding with routing and auth hook"
```

---

## Task 10: Home Page

**Files:**
- Modify: `client/src/pages/Home.jsx`
- Modify: `client/src/components/ProgressBar.jsx`

- [ ] **Step 1: Implement `client/src/components/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>}
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', height: '100%', width: `${pct}%`, borderRadius: 8, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `client/src/pages/Home.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Home() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    apiFetch('/progress').then(setProgress);
  }, []);

  if (!progress) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      {/* Streak */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{progress.streakDays}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>日連続</div>
      </div>

      {/* Level & XP */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Lv.{progress.level}</div>
        <ProgressBar value={100 - progress.expToNext} max={100} label={`次のレベルまで ${progress.expToNext} XP`} />
      </div>

      {/* Main quiz button */}
      <button className="btn-primary" onClick={() => navigate('/quiz')} style={{ marginBottom: 16 }}>
        クイズを始める
      </button>

      {/* Progress summary */}
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>全体の進捗</div>
        <ProgressBar
          value={progress.masteredQuizzes}
          max={progress.totalQuizzes}
          label={`${progress.masteredQuizzes} / ${progress.totalQuizzes} 問マスター`}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify visually**

Run dev server, open http://localhost:5173
Expected: Home page with streak, level/XP bar, quiz button, progress summary

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Home page with streak, level, progress"
```

---

## Task 11: Quiz Session Page

**Files:**
- Modify: `client/src/pages/Quiz.jsx`
- Modify: `client/src/components/QuizCard.jsx`
- Modify: `client/src/hooks/useQuiz.js`

- [ ] **Step 1: Implement `client/src/hooks/useQuiz.js`**

```jsx
import { useState } from 'react';
import { apiFetch } from '../api/client.js';

export function useQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  async function startSession(chapterId = null) {
    setLoading(true);
    const path = chapterId ? `/quiz/session?chapterId=${chapterId}` : '/quiz/session';
    const data = await apiFetch(path);
    setQuizzes(data.quizzes);
    setCurrentIndex(0);
    setResults([]);
    setSessionDone(false);
    setLoading(false);
  }

  async function submitAnswer(answer) {
    const quiz = quizzes[currentIndex];
    const data = await apiFetch('/quiz/answer', {
      method: 'POST',
      body: JSON.stringify({ quizId: quiz.id, answer }),
    });
    const result = { ...data, quizId: quiz.id };
    const newResults = [...results, result];
    setResults(newResults);
    return result;
  }

  function nextQuiz() {
    if (currentIndex + 1 >= quizzes.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  const currentQuiz = quizzes[currentIndex] || null;
  const totalXp = results.reduce((sum, r) => sum + r.xpGained, 0);
  const correctCount = results.filter(r => r.correct).length;

  return { currentQuiz, currentIndex, quizzes, results, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount };
}
```

- [ ] **Step 2: Implement `client/src/components/QuizCard.jsx`**

```jsx
import { useState } from 'react';

export default function QuizCard({ quiz, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSelect(choice) {
    if (result) return; // already answered
    setSelected(choice);
    const r = await onAnswer(choice);
    setResult(r);
  }

  function choiceClass(i) {
    if (!result) return selected === i ? 'btn-choice selected' : 'btn-choice';
    if (i === result.correctAnswer) return 'btn-choice correct';
    if (i === selected && !result.correct) return 'btn-choice wrong';
    return 'btn-choice';
  }

  return (
    <div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
        {quiz.question}
      </p>
      {[1, 2, 3, 4].map(i => (
        <button key={i} className={choiceClass(i)} onClick={() => handleSelect(i)}>
          {quiz[`choice_${i}`]}
        </button>
      ))}
      {result && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: result.correct ? 'var(--color-success)' : 'var(--color-error)' }}>
            {result.correct ? '正解！' : '不正解'}
          </div>
          {result.xpGained > 0 && (
            <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>+{result.xpGained} XP</div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement `client/src/pages/Quiz.jsx`**

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz.js';
import QuizCard from '../components/QuizCard.jsx';

export default function Quiz() {
  const navigate = useNavigate();
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();

  useEffect(() => { startSession(); }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (sessionDone) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>セッション完了</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {correctCount}/{quizzes.length}
        </div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>正解</div>
        <div style={{ fontSize: '1.2rem', marginBottom: 24 }}>+{totalXp} XP</div>
        <button className="btn-primary" onClick={() => navigate('/')}>ホームに戻る</button>
      </div>
    );
  }

  if (!currentQuiz) return <div style={{ padding: 20 }}>クイズがありません</div>;

  const answered = results.length > currentIndex;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
        {currentIndex + 1} / {quizzes.length}
      </div>
      <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      {answered && (
        <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 20 }}>
          {currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify visually**

Open http://localhost:5173/quiz (with server running)
Expected: Quiz cards with choices, correct/wrong feedback, session summary

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Quiz session UI with QuizCard and results"
```

---

## Task 12: Chapters Page & Chapter Quiz

**Files:**
- Modify: `client/src/pages/Chapters.jsx`
- Modify: `client/src/pages/ChapterQuiz.jsx`

- [ ] **Step 1: Implement `client/src/pages/Chapters.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Chapters() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    apiFetch('/chapters').then(data => setChapters(data.chapters));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>章一覧</h2>
      {chapters.map(ch => (
        <div
          key={ch.id}
          onClick={() => navigate(`/chapters/${ch.id}`)}
          style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{ch.title}</div>
          <ProgressBar value={ch.mastered} max={ch.total_quizzes} label={`${ch.mastered}/${ch.total_quizzes}`} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement `client/src/pages/ChapterQuiz.jsx`**

Reuses `useQuiz` hook with `chapterId` parameter. Same structure as `Quiz.jsx` but calls `startSession(chapterId)`.

```jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz.js';
import QuizCard from '../components/QuizCard.jsx';

export default function ChapterQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();

  useEffect(() => { startSession(id); }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (sessionDone) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>完了</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{correctCount}/{quizzes.length}</div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>正解</div>
        <div style={{ fontSize: '1.2rem', marginBottom: 24 }}>+{totalXp} XP</div>
        <button className="btn-primary" onClick={() => navigate('/chapters')}>章一覧に戻る</button>
      </div>
    );
  }

  if (!currentQuiz) return <div style={{ padding: 20 }}>この章のクイズはありません</div>;

  const answered = results.length > currentIndex;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
        {currentIndex + 1} / {quizzes.length}
      </div>
      <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      {answered && (
        <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 20 }}>
          {currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2.5: Add chapterId support to server quiz route**

Modify `server/src/routes/quiz.js` `GET /session` handler. Add after `const planFilter = ...`:

```js
// Chapter filter (parameterized to prevent SQL injection)
const chapterId = req.query.chapterId ? parseInt(req.query.chapterId, 10) : null;
```

Then update each of the 3 SQL queries to accept an additional parameter when `chapterId` is set. Example for the due quizzes query:

```js
const params = [userId, now];
let chapterFilter = '';
if (chapterId) {
  chapterFilter = `AND q.chapter_id = $${params.length + 1}`;
  params.push(chapterId);
}

const dueResult = await pool.query(
  `SELECT q.id as quiz_id, q.* FROM quizzes q
   JOIN user_quiz_progress p ON p.quiz_id = q.id AND p.user_id = $1
   WHERE p.next_due_at <= $2 AND p.correct_streak < 4
   ${planFilter} ${chapterFilter}
   ORDER BY p.next_due_at ASC`,
  params
);
```

Apply the same parameterized pattern to the wrong and unseen queries (adjusting `$N` indices accordingly).

- [ ] **Step 3: Verify visually**

Navigate to /chapters, click a chapter, verify quizzes load.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Chapters listing and chapter quiz mode"
```

---

## Task 13: Progress Page with XP Chart

**Files:**
- Modify: `client/src/pages/Progress.jsx`
- Modify: `client/src/components/ExpChart.jsx`

- [ ] **Step 1: Implement `client/src/components/ExpChart.jsx`**

Simple SVG bar chart (no external dependency):

```jsx
export default function ExpChart({ history }) {
  if (!history || history.length === 0) return <div style={{ color: 'var(--color-text-muted)' }}>データなし</div>;

  const maxExp = Math.max(...history.map(h => h.exp), 1);
  const barWidth = 100 / Math.max(history.length, 1);

  return (
    <svg viewBox="0 0 300 120" style={{ width: '100%', height: 120 }}>
      {history.slice().reverse().map((h, i) => {
        const height = (h.exp / maxExp) * 100;
        return (
          <g key={h.date}>
            <rect
              x={i * (300 / history.length) + 2}
              y={110 - height}
              width={Math.max(300 / history.length - 4, 4)}
              height={height}
              fill="var(--color-primary)"
              rx={3}
            />
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Implement `client/src/pages/Progress.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import ProgressBar from '../components/ProgressBar.jsx';
import ExpChart from '../components/ExpChart.jsx';

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    apiFetch('/progress').then(setProgress);
    apiFetch('/progress/exp-history').then(data => setHistory(data.history));
  }, []);

  if (!progress) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>進捗</h2>

      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>レベル {progress.level}</div>
        <ProgressBar value={100 - progress.expToNext} max={100} label={`${progress.exp} XP（次まで ${progress.expToNext} XP）`} />
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>マスター進捗</div>
        <ProgressBar value={progress.masteredQuizzes} max={progress.totalQuizzes} label={`${progress.masteredQuizzes} / ${progress.totalQuizzes}`} />
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>経験値推移（30日間）</div>
        <ExpChart history={history} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify visually**

Open http://localhost:5173/progress
Expected: Level, mastery bar, XP chart

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Progress page with XP chart"
```

---

## Task 14: Diagnosis Quiz Page

**Files:**
- Modify: `client/src/pages/Diagnosis.jsx`

- [ ] **Step 1: Implement `client/src/pages/Diagnosis.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';

export default function Diagnosis() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiFetch('/diagnosis/quizzes').then(data => setQuizzes(data.quizzes));
  }, []);

  async function handleSelect(choice) {
    if (selected !== null) return;
    setSelected(choice);

    const newAnswers = [...answers, { quizId: quizzes[currentIndex].id, answer: choice }];
    setAnswers(newAnswers);

    // Auto-advance after brief delay
    setTimeout(() => {
      if (currentIndex + 1 >= quizzes.length) {
        // Submit all answers
        apiFetch('/diagnosis/submit', {
          method: 'POST',
          body: JSON.stringify({ answers: newAnswers }),
        }).then(setResult);
      } else {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      }
    }, 500);
  }

  if (result) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>診断完了</h2>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {result.correctCount}/{result.totalCount}
        </div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>正解</div>
        {result.skippedLight && (
          <p style={{ marginBottom: 16, color: 'var(--color-success)' }}>基礎問題をスキップしました</p>
        )}
        <button className="btn-primary" onClick={() => window.location.reload()}>
          始める
        </button>
      </div>
    );
  }

  if (quizzes.length === 0) return <div style={{ padding: 20 }}>Loading...</div>;

  const quiz = quizzes[currentIndex];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>レベル診断</div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
        {currentIndex + 1} / {quizzes.length}
      </div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>{quiz.question}</p>
      {[1, 2, 3, 4].map(i => (
        <button
          key={i}
          className={`btn-choice${selected === i ? ' selected' : ''}`}
          onClick={() => handleSelect(i)}
        >
          {quiz[`choice_${i}`]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify visually**

Test with a basic/pro user who hasn't completed diagnosis.
Expected: Diagnosis quiz flow, auto-advance, result with skip info.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Diagnosis quiz page"
```

---

## Task 15: Header Navigation

**Files:**
- Modify: `client/src/components/Header.jsx`

- [ ] **Step 1: Implement `client/src/components/Header.jsx`**

```jsx
import { NavLink } from 'react-router-dom';

const navStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  borderBottom: '1px solid var(--color-border)',
  padding: '12px 0',
  position: 'sticky',
  top: 0,
  background: 'var(--color-bg)',
  zIndex: 10,
};

const linkStyle = ({ isActive }) => ({
  textDecoration: 'none',
  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
  fontWeight: isActive ? 700 : 400,
  fontSize: '0.9rem',
});

export default function Header() {
  return (
    <nav style={navStyle}>
      <NavLink to="/" style={linkStyle} end>ホーム</NavLink>
      <NavLink to="/chapters" style={linkStyle}>章</NavLink>
      <NavLink to="/progress" style={linkStyle}>進捗</NavLink>
    </nav>
  );
}
```

- [ ] **Step 2: Verify navigation works**

Click between Home, Chapters, Progress tabs.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Header navigation"
```

---

## Task 16: Streak Logic (Server-Side)

**Files:**
- Modify: `server/src/routes/quiz.js` (POST /api/quiz/answer)

- [ ] **Step 1: Add streak update logic to answer route**

**Important:** Read `last_played_at` BEFORE updating it to `now`. Place this code in `POST /api/quiz/answer` right before the `UPDATE users SET last_played_at = $1` line:

```js
// Read last_played_at BEFORE updating it (otherwise it's always today)
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
  // diffDays === 0: same day, no change
} else {
  await pool.query('UPDATE users SET streak_days = 1 WHERE id = $1', [userId]);
}
```

- [ ] **Step 2: Test streak logic**

Submit answers on consecutive simulated days, verify streak increments.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: streak day tracking"
```

---

## Task 17: Docker Compose Full Stack

**Files:**
- Modify: `docker-compose.yml`
- Create: `server/Dockerfile`
- Create: `client/Dockerfile`

- [ ] **Step 1: Create `server/Dockerfile`**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
EXPOSE 3001
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Create `client/Dockerfile`**

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Create `client/nginx.conf`**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api {
        proxy_pass http://server:3001;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 4: Update `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jta
      POSTGRES_USER: jta
      POSTGRES_PASSWORD: jta_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  server:
    build: ./server
    environment:
      DATABASE_URL: postgres://jta:jta_dev@db:5432/jta
      JWT_SECRET: ${JWT_SECRET:-dev-secret}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - db

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  pgdata:
```

- [ ] **Step 5: Test full stack build**

Run: `docker compose build`
Run: `docker compose up -d`
Run: `curl http://localhost/api/chapters` (expect 401)
Expected: All services running

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Docker Compose full stack deployment"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|-----------------|
| 1 | Project Scaffolding & Docker Compose | 9 |
| 2 | Database Migration | 6 |
| 3 | Seed Data (20 Quizzes) | 5 |
| 4 | SRS Logic (Pure Functions) | 5 |
| 5 | XP Logic (Pure Functions) | 5 |
| 6 | Express Server & Auth | 8 |
| 7 | Quiz API Routes | 5 |
| 8 | Chapters, Progress, User, Diagnosis Routes | 9 |
| 9 | Frontend Scaffolding | 10 |
| 10 | Home Page | 4 |
| 11 | Quiz Session Page | 5 |
| 12 | Chapters Page & Chapter Quiz | 4 |
| 13 | Progress Page with XP Chart | 4 |
| 14 | Diagnosis Quiz Page | 3 |
| 15 | Header Navigation | 3 |
| 16 | Streak Logic | 3 |
| 17 | Docker Compose Full Stack | 6 |
| **Total** | | **94 steps** |

### Dependencies

```
Task 1 (scaffolding) → Task 2 (migration) → Task 3 (seed)
Task 2 → Task 4 (SRS) + Task 5 (XP) [parallel, pure functions]
Task 4 + 5 + 6 → Task 7 (quiz routes)
Task 7 → Task 8 (remaining routes)
Task 9 (frontend scaffolding) → Tasks 10-15 [mostly parallel]
Task 8 + 15 → Task 16 (streak)
All → Task 17 (Docker full stack)
```
