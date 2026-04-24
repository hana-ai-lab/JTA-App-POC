---
name: quiz-md-to-sql
description: クイズMarkdownファイルをSQLに変換し、DBに流し込んでアプリに反映させる。docs/quizzes/配下のクイズMDを読み、既存seedファイルにINSERT文を追記し、npm run seedでDB反映、必要に応じてアプリを起動する。トリガー：「クイズをSQLに変換」「quiz to sql」「クイズをインポート」「シードデータ生成」「MDからSQL」「クイズをアプリに反映」「クイズ反映」など。
---

# Quiz MD to SQL

クイズMarkdownを PostgreSQL 用の INSERT 文に変換し、DB に反映する。

## 前提

- 入力:
  - 中級講座: `docs/quizzes/intermediate/section-*/chapter-{NN}.md`
  - 入門/基礎など旧形式: `docs/quizzes/{course}/week-{NN}.md`
- 出力: `server/seeds/001_quiz_data.sql`
- シード実行: `server/src/seed.js` を `npm run seed` で呼ぶ
- 主な投入先:

```sql
INSERT INTO quizzes (chapter_id, question, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation, available_for_light, sort_order) VALUES (...);
```

## 手順

### 1. 対象の確認

変換対象を確認する。指定がなければ直接ユーザーに聞く。

- 中級講座の単一章: `docs/quizzes/intermediate/section-02-economic-indicators/chapter-10.md`
- 中級講座全体: `docs/quizzes/intermediate/`
- 単一ファイル: `docs/quizzes/kohaku/week-01.md`
- コース全体: `docs/quizzes/kohaku/`
- 全ファイル: `docs/quizzes/`

### 2. chapter との対応確認

`server/seeds/001_quiz_data.sql` を読み、chapter と course/week/title の対応を確認する。対応が曖昧ならユーザーに確認する。

中級講座の場合:

- MDの `course: intermediate`、`chapter`、`sort_order`、`title` を読む
- `sort_order` と seed内の中級講座chapterタイトルが一致するか確認する
- 現行seedでは中級第1章が `chapter_id = 25`、第37章が `chapter_id = 61` のため、原則 `chapter_id = sort_order`
- `docs/quizzes/kohana/week-13.md`〜`week-18.md` ではなく `docs/quizzes/intermediate/` 配下を入力の正本にする

### 3. SQL生成とseedファイル更新

大量変換では Node.js スクリプトを使う。

- `## Q\d+` で分割
- `**問題:**`, `- A)`, `**正解:**`, `**解説:**` を抽出
- `A=1`, `B=2`, `C=3`, `D=4`
- シングルクォートを `''` にエスケープ
- INSERT 文を生成して seed に追記

少数ファイルなら直接編集してもよい。

### 4. SQLのバリデーション

確認項目:

- 各ファイルの問題数（中級講座は章ごとに異なるため、MDの件数を正とする）
- `correct_answer` が 1〜4
- 選択肢が4件そろっているか
- クォートのエスケープ
- `chapter_id` の整合性

例:

```bash
grep -oE "^\([0-9]+, " server/seeds/001_quiz_data.sql | sort | uniq -c
grep -c "),," server/seeds/001_quiz_data.sql
```

### 5. DB反映

```bash
cd server && npm run seed
```

エラー時は SQL 構文とエスケープを優先確認する。

### 6. DB反映の確認

必要なら DB に接続して chapter ごとの件数を確認する。

### 7. アプリ起動

必要に応じて `server` と `client` の dev server を起動する。既に起動中ならスキップする。

### 8. 報告

- 変換ファイル数
- 合計問題数
- DB反映の成否
- 利用できるURL
