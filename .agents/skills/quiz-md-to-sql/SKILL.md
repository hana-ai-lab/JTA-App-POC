---
name: quiz-md-to-sql
description: クイズMarkdownファイルをSQLに変換し、DBに流し込んでアプリに反映させる。docs/quizzes/配下のクイズMDを読み、既存seedファイルにINSERT文を追記し、npm run seedでDB反映、必要に応じてアプリを起動する。トリガー：「クイズをSQLに変換」「quiz to sql」「クイズをインポート」「シードデータ生成」「MDからSQL」「クイズをアプリに反映」「クイズ反映」など。
---

# Quiz MD to SQL

クイズMarkdownファイルをPostgreSQL用のSQL INSERT文に変換し、DBに流し込んでアプリに反映させるスキル。

## 前提

- 入力:
  - 中級講座: `docs/quizzes/intermediate/section-*/chapter-{NN}.md`
  - 入門/基礎など旧形式: `docs/quizzes/{course}/week-{NN}.md`
- 出力: `server/seeds/001_quiz_data.sql` に追記
- シードスクリプト: `server/src/seed.js`（`npm run seed` で実行）
- アプリ構成: monorepo（workspaces: server, client）
- DBスキーマ（参考）:

```sql
-- quizzes テーブルの主要カラム
INSERT INTO quizzes (chapter_id, question, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation, available_for_light, sort_order) VALUES ...;
```

## 手順

### 1. 変換対象の確認

ユーザーに変換するファイルを確認する。指定がなければ直接ユーザーに聞く。

対象の指定方法:
- 中級講座の単一章: `docs/quizzes/intermediate/section-02-economic-indicators/chapter-10.md`
- 中級講座全体: `docs/quizzes/intermediate/`
- 単一ファイル: `docs/quizzes/kohaku/week-01.md`
- コース全体: `docs/quizzes/kohaku/` 配下すべて
- 全ファイル: `docs/quizzes/` 配下すべて

### 2. chapter との対応確認

既存のseedファイル（`server/seeds/001_quiz_data.sql`）を読み、chapters INSERT文からcourse・week_number・idの対応を把握する。MDのフロントマターの`title`と既存chapterの`title`を照合して、どのchapter_idに紐付けるか決定する。

中級講座の場合:
- MDの `course: intermediate`、`chapter`、`sort_order`、`title` を読む
- `sort_order` と seed内の中級講座chapterタイトルが一致するか確認する
- 現行seedでは中級第1章が `chapter_id = 25`、第37章が `chapter_id = 61` のため、原則 `chapter_id = sort_order`
- `docs/quizzes/kohana/week-13.md`〜`week-18.md` ではなく `docs/quizzes/intermediate/` 配下を入力の正本にする

**対応が不明な場合はユーザーに確認する。**

### 3. SQL生成とseedファイル更新

**推奨アプローチ：Node.jsスクリプトを使う**

大量ファイルの一括変換では、手書きSQLよりNode.jsスクリプトでパースする方がエラーが少ない。以下のようなスクリプトを `/tmp/parse_quizzes.mjs` に書いて実行する:

```javascript
// スクリプトの要点:
// 1. MDファイルを読み込み、## Q\d+ で分割
// 2. **問題:** / - A) / **正解:** / **解説:** を正規表現で抽出
// 3. correct_answer は A=1, B=2, C=3, D=4 に変換
// 4. シングルクォートを '' にエスケープ
// 5. INSERT文を生成してseedファイルにappendFileSync
```

**少数ファイルの場合はEdit toolで直接追記してもよい。**

### 4. SQLのバリデーション

生成したSQLの整合性をチェックする:

- 各ファイルの問題数がMDとSQLで一致するか（中級講座は章ごとに問題数が異なる）
- `correct_answer` が 1〜4 の範囲内か
- 選択肢が4つとも埋まっているか
- シングルクォートのエスケープが正しいか（`),,` や `$),` などの不正文字がないか）
- chapter_id が既存chaptersと一致しているか

**バリデーションコマンド例:**
```bash
# chapter別の問題数確認
grep -oE "^\([0-9]+, " server/seeds/001_quiz_data.sql | sort | uniq -c
# 二重カンマ等の不正チェック
grep -c "),," server/seeds/001_quiz_data.sql
```

### 5. DB反映（seed実行）

SQLが正しいことを確認したら、DBに流し込む:

```bash
cd server && npm run seed
```

**エラーが出た場合の対処:**
- `syntax error` → seedファイル内のSQL構文を確認（エスケープ漏れ、不正文字）
- `relation already exists` → テーブルは既にあるのでmigrate不要、seedだけでOK

### 6. DB反映の確認

seed完了後、直接DBクエリで確認する:

```bash
cd server && node -e "
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('SELECT chapter_id, COUNT(*) FROM quizzes GROUP BY chapter_id ORDER BY chapter_id');
res.rows.forEach(r => console.log('Chapter', r.chapter_id + ':', r.count, 'questions'));
pool.end();
"
```

各chapterに期待通りの問題数が入っていることを確認する。

### 7. アプリ起動（必要に応じて）

dev serverが起動していない場合は起動する:

```bash
# server と client が別々のworkspaceの場合
cd server && npm run dev &
cd client && npm run dev &
```

サーバーが既に起動中の場合（EADDRINUSE）はスキップしてよい。

### 8. 報告

最終的に以下をユーザーに報告する:
- 変換したファイル数と合計問題数
- DB反映の成否
- アプリのURL（http://localhost:5173 など）
