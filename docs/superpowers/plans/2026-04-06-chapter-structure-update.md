# Chapter Structure Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 構成一覧.mdに基づき、全コースの章データを正確に更新し、中級講座を新規追加する。

**Architecture:** シードSQL（001_quiz_data.sql）のchapter INSERT文を全書き換え + フロントエンドのCOURSES定数・DUMMY_CHAPTERSを更新。APIやマイグレーションの変更は不要。

**Tech Stack:** PostgreSQL (seed SQL), React (JSX constants)

**Spec:** `docs/superpowers/specs/2026-04-06-chapter-structure-update-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/seeds/001_quiz_data.sql` | Modify | chapter INSERT文を全書き換え（クイズ・diagnosis部分はそのまま） |
| `client/src/App.jsx` | Modify | COURSES定数 + DUMMY_CHAPTERS を更新 |

---

### Task 1: シードSQL — Lite（コハク）章データ更新

**Files:**
- Modify: `server/seeds/001_quiz_data.sql:12-34`

- [ ] **Step 1: Liteの既存chapter INSERT文を新データに書き換え**

既存の Lite 12章 INSERT（3ブロック）を以下に置き換える。タイトルを構成一覧.mdに合わせ、section構造は維持（3部×4週）。

```sql
-- ============================================================
-- Lite (コハク) — 入門講座: 12章
-- ============================================================

-- 第1部: なぜ負けるのか (Week 1-4)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('なぜ負けるのか — 9割が退場する本当の理由', 1, 'lite', 1, 'なぜ負けるのか', 1),
  ('敵はマーケットではなくあなた自身です', 2, 'lite', 1, 'なぜ負けるのか', 2),
  ('資金管理 — 生き残りの数学', 3, 'lite', 1, 'なぜ負けるのか', 3),
  ('損切りは技術、ナンピンは感情', 4, 'lite', 1, 'なぜ負けるのか', 4);

-- 第2部: 感情をコントロールする (Week 5-8)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('4つの暴走感情 — 恐怖・欲・焦り・後悔', 5, 'lite', 2, '感情をコントロールする', 5),
  ('リベンジトレードの罠', 6, 'lite', 2, '感情をコントロールする', 6),
  ('「やらない」という最強の判断', 7, 'lite', 2, '感情をコントロールする', 7),
  ('負けパターン22種 — あなたはどれ？', 8, 'lite', 2, '感情をコントロールする', 8);

-- 第3部: 仕組みで守る (Week 9-12)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('メタ認知 — 感情に気づく技術', 9, 'lite', 3, '仕組みで守る', 9),
  ('トレード日誌の力', 10, 'lite', 3, '仕組みで守る', 10),
  ('ルールを作る、ルールを守る', 11, 'lite', 3, '仕組みで守る', 11),
  ('焦らなくて大丈夫です — 続けるための仕組み', 12, 'lite', 3, '仕組みで守る', 12);
```

- [ ] **Step 2: 差分を目視確認**

変更点:
- Week 1: タイトル先頭に「なぜ負けるのか — 」追加
- Week 2: `認知バイアスの全体像` → `敵はマーケットではなくあなた自身です`
- Week 5: タイトル末尾に「— 恐怖・欲・焦り・後悔」追加
- Week 8: タイトル末尾に「— あなたはどれ？」追加
- Week 12: タイトル先頭に「焦らなくて大丈夫です — 」追加

---

### Task 2: シードSQL — Basic Pro（コハナ）章データ更新

**Files:**
- Modify: `server/seeds/001_quiz_data.sql:36-59`

- [ ] **Step 1: Basic Proの既存chapter INSERT文を新データに書き換え**

既存の Basic Pro 12章（3 Step）を、序章含む13章（4 Part）に置き換える。sort_orderはLiteの12の続きで13から開始。

```sql
-- ============================================================
-- Basic Pro (コハナ) — 基礎講座: 序章+12章=13章
-- ============================================================

-- Part 1: 全体像を把握し、最初の一歩を踏み出す (Week 1-2)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('ゴールを知る', 13, 'basic_pro', 1, '全体像を把握し、最初の一歩を踏み出す', 1),
  ('敵は自分自身', 14, 'basic_pro', 1, '全体像を把握し、最初の一歩を踏み出す', 2);

-- Part 2: チャートが語りかけてくるようになる5つの技術 (Week 3-4)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('相場の正体', 15, 'basic_pro', 2, 'チャートが語りかけてくるようになる5つの技術', 3),
  ('波の法則', 16, 'basic_pro', 2, 'チャートが語りかけてくるようになる5つの技術', 4);

-- Part 3: 読めるようになった相場で、どこで仕掛けるかを学ぶ (Week 5-7)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('トレンドを知る', 17, 'basic_pro', 3, '読めるようになった相場で、どこで仕掛けるかを学ぶ', 5),
  ('足を読む', 18, 'basic_pro', 3, '読めるようになった相場で、どこで仕掛けるかを学ぶ', 6),
  ('エネルギーを測る', 19, 'basic_pro', 3, '読めるようになった相場で、どこで仕掛けるかを学ぶ', 7);

-- Part 4: 1回勝つことと、5年後もまだ市場にいることは別の話 (Week 8-13)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('大口の足跡', 20, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 8),
  ('面で待つ', 21, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 9),
  ('計画を立てる', 22, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 10),
  ('生き残る技術', 23, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 11),
  ('やり切る力', 24, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 12),
  ('ドリル30', 25, 'basic_pro', 4, '1回勝つことと、5年後もまだ市場にいることは別の話', 13);
```

- [ ] **Step 2: 差分を目視確認**

変更点:
- 3 Step → 4 Part 構成に変更
- 12章 → 13章（序章「ゴールを知る」追加）
- 全タイトルが構成一覧.md準拠に変更
- sort_order: 13-25（Liteの12の続き）

---

### Task 3: シードSQL — Intermediate（中級講座）新規追加

**Files:**
- Modify: `server/seeds/001_quiz_data.sql` (diagnosis_quizzesの前に追加)

- [ ] **Step 1: Intermediate 49章のINSERT文をdiagnosis_quizzesセクションの前に追加**

sort_orderはBasic Proの25の続きで26から開始。全6テーマ。

```sql
-- ============================================================
-- Intermediate (コハナ) — 中級講座: 49章
-- ============================================================

-- テーマ1: トレード心理の上級編 (Week 1-8)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編との関連：第1章「ゴールと生存」の発展', 26, 'intermediate', 1, 'トレード心理の上級編', 1),
  ('連勝バイアス — 「俺は勝てる」が最も危険な瞬間', 27, 'intermediate', 1, 'トレード心理の上級編', 2),
  ('確証バイアス — 「見たいものしか見えない」の罠', 28, 'intermediate', 1, 'トレード心理の上級編', 3),
  ('成功体験への執着 — 「前はこれで勝てた」の呪縛', 29, 'intermediate', 1, 'トレード心理の上級編', 4),
  ('「勝ち始めた後」に現れるその他の心理的罠', 30, 'intermediate', 1, 'トレード心理の上級編', 5),
  ('心理的な罠を「仕組み」で回避する — 意志力に頼らない設計', 31, 'intermediate', 1, 'トレード心理の上級編', 6),
  ('5つのケーススタディ — 中級者が陥る心理的罠の実例', 32, 'intermediate', 1, 'トレード心理の上級編', 7),
  ('最大の敵は、相場ではなく自分自身', 33, 'intermediate', 1, 'トレード心理の上級編', 8);

-- テーマ2: 経済指標トレードの実践 (Week 9-17)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編との関連：第2章セクション4.5の発展', 34, 'intermediate', 2, '経済指標トレードの実践', 9),
  ('経済指標の「格付け」— 全ての指標が同じ重要度ではない', 35, 'intermediate', 2, '経済指標トレードの実践', 10),
  ('指標発表「前」の立ち回り — ポジション整理と準備', 36, 'intermediate', 2, '経済指標トレードの実践', 11),
  ('指標発表「中」の立ち回り — 混乱を冷静に見送る', 37, 'intermediate', 2, '経済指標トレードの実践', 12),
  ('指標発表「後」の立ち回り — 再エントリーの判断基準', 38, 'intermediate', 2, '経済指標トレードの実践', 13),
  ('指標別の立ち回りガイド — Tier 1指標の実戦対応', 39, 'intermediate', 2, '経済指標トレードの実践', 14),
  ('5つのケーススタディ — 指標前後の実戦判断', 40, 'intermediate', 2, '経済指標トレードの実践', 15),
  ('経済指標チェックシート — 毎週のルーティンに組み込む', 41, 'intermediate', 2, '経済指標トレードの実践', 16),
  ('指標は「避ける」ものではなく「活かす」もの', 42, 'intermediate', 2, '経済指標トレードの実践', 17);

-- テーマ3: MTF分析と環境認識の実践 (Week 18-25)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編との関連：第2章セクション4＋第4章セクション4', 43, 'intermediate', 3, 'MTF分析と環境認識の実践', 18),
  ('環境認識の再定義 — 「見る」から「読む」へ', 44, 'intermediate', 3, 'MTF分析と環境認識の実践', 19),
  ('マルチタイムフレーム分析 — 3層構造の実践', 45, 'intermediate', 3, 'MTF分析と環境認識の実践', 20),
  ('時間軸の衝突 — 上位足と下位足が矛盾するとき', 46, 'intermediate', 3, 'MTF分析と環境認識の実践', 21),
  ('環境認識×ファンダメンタルズ — 二刀流の判断法', 47, 'intermediate', 3, 'MTF分析と環境認識の実践', 22),
  ('実戦シナリオ分析 — 5つのケーススタディ', 48, 'intermediate', 3, 'MTF分析と環境認識の実践', 23),
  ('環境認識チェックシート — 毎日のルーティン', 49, 'intermediate', 3, 'MTF分析と環境認識の実践', 24),
  ('環境認識を「習慣」にする', 50, 'intermediate', 3, 'MTF分析と環境認識の実践', 25);

-- テーマ4: プライスアクション応用 (Week 26-33)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編第5章＋第6章の統合実践', 51, 'intermediate', 4, 'プライスアクション応用', 26),
  ('三位一体の判断フレームワーク', 52, 'intermediate', 4, 'プライスアクション応用', 27),
  ('「場所」の精密判定 — 効く場所と効かない場所', 53, 'intermediate', 4, 'プライスアクション応用', 28),
  ('「足の質」の判定 — パターンのグレード分け', 54, 'intermediate', 4, 'プライスアクション応用', 29),
  ('「出来高」による裏付け — 本物と見せかけを見抜く', 55, 'intermediate', 4, 'プライスアクション応用', 30),
  ('三位一体の実戦判定 — 7つのケーススタディ', 56, 'intermediate', 4, 'プライスアクション応用', 31),
  ('三位一体チェックシート — トリガー判定のルーティン化', 57, 'intermediate', 4, 'プライスアクション応用', 32),
  ('「待つ」ことが最強のプライスアクション', 58, 'intermediate', 4, 'プライスアクション応用', 33);

-- テーマ5: 大口の行動パターン実践編 (Week 34-41)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編第7章「大口の足跡」の発展', 59, 'intermediate', 5, '大口の行動パターン実践編', 34),
  ('大口の仕掛けを「読む」技術 — なぜダマシは繰り返されるのか', 60, 'intermediate', 5, '大口の行動パターン実践編', 35),
  ('ストップ狩りの見極め方 — リアルタイムで「狩り」を検知する', 61, 'intermediate', 5, '大口の行動パターン実践編', 36),
  ('ダマシ確認後のエントリー技術 — デュクシ・エントリーの精密化', 62, 'intermediate', 5, '大口の行動パターン実践編', 37),
  ('ベアトラップとブルトラップの逆利用テクニック', 63, 'intermediate', 5, '大口の行動パターン実践編', 38),
  ('5つのケーススタディ — 大口の仕掛けを利益に変える', 64, 'intermediate', 5, '大口の行動パターン実践編', 39),
  ('大口の仕掛けチェックリスト — 毎日のルーティンに組み込む', 65, 'intermediate', 5, '大口の行動パターン実践編', 40),
  ('「狩られる側」から「乗る側」へ', 66, 'intermediate', 5, '大口の行動パターン実践編', 41);

-- テーマ6: シナリオ構築の上級技法 (Week 42-49)
INSERT INTO chapters (title, sort_order, course, section_number, section_title, week_number) VALUES
  ('基礎編第9章「計画を立てる」の発展', 67, 'intermediate', 6, 'シナリオ構築の上級技法', 42),
  ('なぜ1つのシナリオでは足りないのか', 68, 'intermediate', 6, 'シナリオ構築の上級技法', 43),
  ('メインシナリオとサブシナリオの設計法', 69, 'intermediate', 6, 'シナリオ構築の上級技法', 44),
  ('シナリオの「切り替え条件」— いつメインを捨てサブに移行するか', 70, 'intermediate', 6, 'シナリオ構築の上級技法', 45),
  ('「想定外」をなくす思考法 — If-Then-Elseの構造化', 71, 'intermediate', 6, 'シナリオ構築の上級技法', 46),
  ('5つのケーススタディ — 複数シナリオの実戦運用', 72, 'intermediate', 6, 'シナリオ構築の上級技法', 47),
  ('シナリオ管理シート — 毎日の準備ルーティン', 73, 'intermediate', 6, 'シナリオ構築の上級技法', 48),
  ('シナリオは「予言」ではなく「準備」', 74, 'intermediate', 6, 'シナリオ構築の上級技法', 49);
```

- [ ] **Step 2: sort_order連番を確認**

Lite: 1-12, Basic Pro: 13-25, Intermediate: 26-74。合計74章。

---

### Task 4: フロントエンド — COURSES定数更新

**Files:**
- Modify: `client/src/App.jsx:10-31`

- [ ] **Step 1: COURSES定数を書き換え**

```js
const COURSES = [
  {
    id: 'lite',
    name: '入門講座',
    subtitle: 'コハク',
    parts: [
      { number: 1, title: 'なぜ負けるのか' },
      { number: 2, title: '感情をコントロールする' },
      { number: 3, title: '仕組みで守る' },
    ],
  },
  {
    id: 'basic_pro',
    name: '基礎講座',
    subtitle: 'コハナ',
    parts: [
      { number: 1, title: '全体像を把握し、最初の一歩を踏み出す' },
      { number: 2, title: 'チャートが語りかけてくるようになる5つの技術' },
      { number: 3, title: '読めるようになった相場で、どこで仕掛けるかを学ぶ' },
      { number: 4, title: '1回勝つことと、5年後もまだ市場にいることは別の話' },
    ],
  },
  {
    id: 'intermediate',
    name: '中級講座',
    subtitle: 'コハナ',
    parts: [
      { number: 1, title: 'トレード心理の上級編' },
      { number: 2, title: '経済指標トレードの実践' },
      { number: 3, title: 'MTF分析と環境認識の実践' },
      { number: 4, title: 'プライスアクション応用' },
      { number: 5, title: '大口の行動パターン実践編' },
      { number: 6, title: 'シナリオ構築の上級技法' },
    ],
  },
];
```

---

### Task 5: フロントエンド — DUMMY_CHAPTERS更新

**Files:**
- Modify: `client/src/App.jsx:64-79`

- [ ] **Step 1: DUMMY_CHAPTERSを新構造に合わせて書き換え**

各コースから代表的な章を含め、進捗のバリエーション（mastered/completed/未着手）を維持する。

```js
const DUMMY_CHAPTERS = [
  // lite course (入門講座)
  { id: 1, course: 'lite', section_number: 1, section_title: 'なぜ負けるのか', week_number: 1, title: 'なぜ負けるのか — 9割が退場する本当の理由', total_quizzes: 20, completed: 20, mastered: 20 },
  { id: 2, course: 'lite', section_number: 1, section_title: 'なぜ負けるのか', week_number: 2, title: '敵はマーケットではなくあなた自身です', total_quizzes: 20, completed: 20, mastered: 20 },
  { id: 3, course: 'lite', section_number: 2, section_title: '感情をコントロールする', week_number: 5, title: '4つの暴走感情 — 恐怖・欲・焦り・後悔', total_quizzes: 20, completed: 12, mastered: 5 },
  { id: 4, course: 'lite', section_number: 3, section_title: '仕組みで守る', week_number: 9, title: 'メタ認知 — 感情に気づく技術', total_quizzes: 20, completed: 3, mastered: 0 },
  // basic_pro course (基礎講座)
  { id: 13, course: 'basic_pro', section_number: 1, section_title: '全体像を把握し、最初の一歩を踏み出す', week_number: 1, title: 'ゴールを知る', total_quizzes: 20, completed: 20, mastered: 20 },
  { id: 14, course: 'basic_pro', section_number: 1, section_title: '全体像を把握し、最初の一歩を踏み出す', week_number: 2, title: '敵は自分自身', total_quizzes: 20, completed: 15, mastered: 9 },
  { id: 15, course: 'basic_pro', section_number: 2, section_title: 'チャートが語りかけてくるようになる5つの技術', week_number: 3, title: '相場の正体', total_quizzes: 20, completed: 2, mastered: 0 },
  { id: 20, course: 'basic_pro', section_number: 4, section_title: '1回勝つことと、5年後もまだ市場にいることは別の話', week_number: 8, title: '大口の足跡', total_quizzes: 20, completed: 0, mastered: 0 },
  // intermediate course (中級講座)
  { id: 26, course: 'intermediate', section_number: 1, section_title: 'トレード心理の上級編', week_number: 1, title: '基礎編との関連：第1章「ゴールと生存」の発展', total_quizzes: 20, completed: 20, mastered: 18 },
  { id: 27, course: 'intermediate', section_number: 1, section_title: 'トレード心理の上級編', week_number: 2, title: '連勝バイアス — 「俺は勝てる」が最も危険な瞬間', total_quizzes: 20, completed: 5, mastered: 0 },
  { id: 34, course: 'intermediate', section_number: 2, section_title: '経済指標トレードの実践', week_number: 9, title: '基礎編との関連：第2章セクション4.5の発展', total_quizzes: 20, completed: 0, mastered: 0 },
  { id: 51, course: 'intermediate', section_number: 4, section_title: 'プライスアクション応用', week_number: 26, title: '基礎編第5章＋第6章の統合実践', total_quizzes: 20, completed: 0, mastered: 0 },
];
```

---

### Task 6: コミット

- [ ] **Step 1: 変更をステージング**

```bash
git add server/seeds/001_quiz_data.sql client/src/App.jsx
```

- [ ] **Step 2: コミット**

```bash
git commit -m "feat: update chapter structure to match 構成一覧.md

- Lite: fix titles to match source (12 chapters, 3 sections)
- Basic Pro: restructure to 序章+12章=13 chapters, 4 Parts
- Intermediate: add new course with 6 themes, 49 chapters
- Update frontend COURSES and DUMMY_CHAPTERS constants"
```
