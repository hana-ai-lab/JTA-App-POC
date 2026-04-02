# JTA Quiz App 設計書

## 概要

投資学習用クイズアプリ。SRS（間隔反復）による復習システムと、FINCS連携認証を備える。

## 技術スタック

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Express.js (Node.js 18+) |
| Database | PostgreSQL 15 |
| Auth | FINCS連携（JWT） |
| Deploy | Docker Compose + Cloudflare Tunnel |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   Client (React)                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  Home   │  │ Chapter │  │ Progress│             │
│  └─────────┘  └─────────┘  └─────────┘             │
│              ┌─────────┐                            │
│              │  Quiz   │                            │
│              └─────────┘                            │
└─────────────────────────────────────────────────────┘
                    │ HTTP/JSON
┌─────────────────────────────────────────────────────┐
│                 Server (Express)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ /auth    │  │ /quiz    │  │ /progress│          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────────┐
│                PostgreSQL                            │
└─────────────────────────────────────────────────────┘
```

## データベース設計

### ER図

```
users ──┬── user_quiz_progress ── quizzes ── chapters
        │
        └── exp_history

diagnosis_quizzes（独立テーブル）
```

### テーブル定義

#### users

```sql
CREATE TABLE users (
  id                        SERIAL PRIMARY KEY,
  fincs_user_id             VARCHAR(255) UNIQUE NOT NULL,
  plan_type                 VARCHAR(50) NOT NULL,  -- 'light' | 'basic' | 'pro'
  level                     INT DEFAULT 1,
  exp                       INT DEFAULT 0,
  streak_days               INT DEFAULT 0,
  last_played_at            TIMESTAMP,
  diagnosis_completed       BOOLEAN DEFAULT FALSE,
  diagnosis_skipped_light   BOOLEAN DEFAULT FALSE
);
```

#### chapters

```sql
CREATE TABLE chapters (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL
);
```

#### quizzes

```sql
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
```

#### diagnosis_quizzes

```sql
CREATE TABLE diagnosis_quizzes (
  id             SERIAL PRIMARY KEY,
  question       TEXT NOT NULL,
  choice_1       VARCHAR(500) NOT NULL,
  choice_2       VARCHAR(500) NOT NULL,
  choice_3       VARCHAR(500) NOT NULL,
  choice_4       VARCHAR(500) NOT NULL,
  correct_answer INT NOT NULL
);
```

#### user_quiz_progress

```sql
CREATE TABLE user_quiz_progress (
  user_id        INT REFERENCES users(id),
  quiz_id        INT REFERENCES quizzes(id),
  correct_streak INT DEFAULT 0,
  next_due_at    TIMESTAMP,
  seen           BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, quiz_id)
);
```

#### exp_history

```sql
CREATE TABLE exp_history (
  user_id    INT REFERENCES users(id),
  exp_change INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API設計

### エンドポイント一覧

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/verify | FINCSトークン検証 + ユーザー登録/ログイン |
| GET | /api/diagnosis/quizzes | 診断クイズ取得 |
| POST | /api/diagnosis/submit | 診断結果送信 → スキップ判定 |
| GET | /api/quiz/session | 次の5問を取得（SRSロジック適用） |
| POST | /api/quiz/answer | 回答送信 → 進捗更新 + 経験値付与 |
| GET | /api/chapters | 章一覧 + 各章の進捗 |
| GET | /api/progress | 全体進捗、レベル、経験値 |
| GET | /api/progress/exp-history | 経験値履歴（グラフ用） |
| GET | /api/user/me | ユーザー情報（プラン含む） |

### 認証

- 全API（/api/auth/verifyを除く）はJWTトークンが必要
- Authorization: Bearer <token>

## フロントエンド構成

### ディレクトリ構造

```
src/
├── pages/
│   ├── Home.jsx         # メインボタン、ストリーク、レベル/経験値
│   ├── Quiz.jsx         # クイズ画面（5問セッション）
│   ├── Chapters.jsx     # 章一覧、進捗表示
│   ├── ChapterQuiz.jsx  # 章モード
│   ├── Progress.jsx     # 全体進捗、経験値グラフ
│   └── Diagnosis.jsx    # 初回診断クイズ
│
├── components/
│   ├── QuizCard.jsx     # クイズ表示コンポーネント
│   ├── ProgressBar.jsx  # 進捗バー
│   ├── ExpChart.jsx     # 経験値グラフ
│   └── Header.jsx       # ヘッダー（ナビゲーション）
│
├── hooks/
│   ├── useAuth.js       # 認証状態管理
│   └── useQuiz.js       # クイズロジック
│
├── api/
│   └── client.js        # API通信
│
└── App.jsx              # ルーティング
```

### 画面遷移

```
ログイン → 診断未完了？
             ├─ Yes → 診断クイズ → Home
             └─ No  → Home

Home → Quiz（5問）→ 結果 → Home
     → Chapters → ChapterQuiz
     → Progress（グラフ）
```

### デバイス対応

- モバイルファースト
- デスクトップ対応（レスポンシブ）

## SRS（間隔反復）ロジック

### 出題優先順位

1. 復習（`next_due_at <= now`）
2. 間違い問題（`correct_streak = 0 AND seen = true`）
3. 未出題（`seen = false`）

### セッション生成（5問）

| 復習件数 | 新規問題数 |
|---------|-----------|
| >= 20 | 0問 |
| >= 10 | 1問 |
| それ以外 | 最大2問 |

残りは復習で埋める。

### 正解時の更新

| correct_streak | next_due_at |
|----------------|-------------|
| 0 → 1 | now + 1日 |
| 1 → 2 | now + 3日 |
| 2 → 3 | now + 7日 |
| 3 → 4 | 卒業（出題しない） |

### 不正解時の更新

- `correct_streak = 0`
- `next_due_at = now + 10分`

## プラン出し分け

### プラン別の挙動

| プラン | 診断 | スキップ対象 |
|--------|------|-------------|
| light | なし | なし |
| basic | あり | available_for_light = true のクイズ |
| pro | あり | available_for_light = true のクイズ |

### 診断スキップ判定

ベーシック/プロプランは初回診断クイズを受ける。

- 正答率が閾値以上 → `available_for_light = true` のクイズを卒業扱い（correct_streak = 4）
- 正答率が閾値未満 → スキップなし

## 認証フロー（FINCS連携）

```
Client                jta-app              FINCS
  │                      │                    │
  │ 1. アプリURLアクセス │                    │
  │─────────────────────>│                    │
  │                      │                    │
  │ 2. FINCS認証へ       │                    │
  │    リダイレクト      │                    │
  │<─────────────────────│                    │
  │                      │                    │
  │ 3. FINCSでログイン   │                    │
  │─────────────────────────────────────────>│
  │                      │                    │
  │ 4. JWTトークン取得   │                    │
  │<─────────────────────────────────────────│
  │                      │                    │
  │ 5. トークン送信      │                    │
  │─────────────────────>│                    │
  │                      │ 6. トークン検証    │
  │                      │    （FINCS公開鍵） │
  │                      │                    │
  │ 7. ユーザー作成/     │                    │
  │    ログイン応答      │                    │
  │<─────────────────────│                    │
```

### JWT検証

- FINCSの公開鍵を使用して署名検証
- トークンから `fincs_user_id` と `plan_type` を抽出

## 経験値システム

### 経験値獲得

| アクション | 獲得経験値 |
|-----------|-----------|
| 新規クイズ正解 | +10 XP |
| 復習クイズ正解 | +5 XP |
| 章マスター | +50 XP |

### レベルアップ

- 100 XP ごとにレベルアップ

### 履歴表示

- `exp_history` テーブルから日別の経験値増加を集計
- グラフで表示

## テーマカラー

- 白 + 深い藍色

## 初期規模

- 20問程度で骨格を作成
- 後から章構成やクイズを追加

## クイズデータ元

- `/Users/neil/Desktop/dev/apps/quiz-app/docs/quizzes.md`
