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

CREATE TABLE exp_history (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  exp_change INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exp_history_user_date ON exp_history (user_id, created_at);
