---
name: quiz-refine
description: JTAクイズアプリの既存クイズを章のテーマに沿ってブラッシュアップするスキル。「クイズを改善して」「クイズをブラッシュアップ」「章のクイズを見直して」「quiz refine」「クイズを直して」など、クイズの品質改善・リライトに関する依頼に使用する。文字数制限・シナリオ型への書き換え・VPS DB直接更新まで一貫して対応。
---

# Quiz Refine Skill

既存クイズを「退場しないトレーダーを育てる」という教育目的に沿って改善する。

## ファイル構成

```text
docs/quizzes/intermediate/section-*/chapter-{NN}.md
docs/quizzes/{course}/week-{NN}.md
server/seeds/001_quiz_data.sql
docs/講義資料/
docs/knowledge/ または docs/*_knowledge_*.md
```

## ステップ

### 1. 対象の確認

コース・章・week を確認する。中級講座の場合は week ではなくアプリ側の章番号を優先する。未指定なら直接ユーザーに聞く。

中級講座のMDは必ず `docs/quizzes/intermediate/` 配下から探す。

- 例: `中級 第10章`
- 対象MD: `docs/quizzes/intermediate/section-02-economic-indicators/chapter-10.md`
- `docs/quizzes/kohana/week-13.md`〜`week-18.md` は参照元であり、見直し対象の正本にしない。

### 2. 章テーマの特定

講義資料とナレッジから、その章で体得させたい核心を 1〜2 文で定義する。

参照順:

1. 対象MDのフロントマター（`section_title`, `chapter`, `app_week`, `title`, `source`）
2. `server/seeds/001_quiz_data.sql` の `chapters` INSERT（アプリ側の章タイトル・section確認）
3. `docs/講義資料/03_STRADA中級編.md` または `docs/講義資料/構成一覧.md`
4. `docs/knowledge/` や `docs/*_knowledge_*.md`（存在する場合）

### 3. 既存クイズの診断

各問題を次の3タイプで分類する。

- 応用型（シナリオ）: 維持または改善
- 定義型: シナリオ型へ書き換え
- 計算型（重複）: 概念問題へ置き換え

診断観点:

- 章テーマとの整合
- 重複の有無
- 循環的な正解文になっていないか
- 用語や分類を当てるだけの問題になっていないか

問いの軸は常に「なぜ負けるか」「どうなるか」「何をすべきか」に置く。

### 4. リライト原則

- シナリオから始める
- 結果や危険性、取るべき行動を問う
- 用語定義を直接聞かない
- 解説は行動や結果で締める

文字数ガイド:

- 問題文: 60〜100文字
- 選択肢: 20〜40文字
- 解説: 80〜120文字

### 5. MDファイルの更新

中級講座は `docs/quizzes/intermediate/section-*/chapter-{NN}.md` を更新する。旧 `docs/quizzes/kohana/week-13.md`〜`week-18.md` は、ユーザーが明示しない限り編集しない。

更新時の確認:

- frontmatter の `course: intermediate` と `chapter` が対象章に一致している
- 問題数を変えない
- `## Q1` から連番を維持する
- `**問題:**` / 選択肢4件 / `**正解:**` / `**解説:**` の形式を崩さない

### 6. SQLファイルの更新

MDを正として、`server/seeds/001_quiz_data.sql` の対応する INSERT 文を更新する。

中級講座の対応:

- MD frontmatter の `sort_order` は `chapters.sort_order`
- 現行seedでは中級第1章が `chapter_id = 25`、第37章が `chapter_id = 61`
- つまり原則 `chapter_id = sort_order`
- SQL更新前に、対象MDの `sort_order` と seed の章タイトルが一致するか確認する

注意:

- シングルクォートは `''`
- `correct_answer` は 1〜4
- 問題数を変えない（中級章は章ごとに問題数が異なるため、対象MDの件数を正とする）

### 7. ローカルDB/アプリへの反映

ローカルや開発環境へ反映する場合は、SQL更新後に通常のアプリ反映手順へ進む。

1. SQLの構文と対象chapterの問題数を確認する
2. `npm run seed` が安全な環境か確認する
3. seed実行または既存DBへのUPDATEで反映する
4. 必要に応じてアプリを起動し、対象章のクイズ表示を確認する

ユーザー進捗があるDBでは `npm run seed` が全消去になる可能性があるため、直接UPDATEを優先する。

### 8. VPS DB の直接更新

`npm run seed` はユーザー進捗を消すため使わず、必要なら VPS の DB を直接更新する。

接続情報:

- host: `85.131.249.99`
- user: `root`
- DB container: `jta-db`
- DB user: `postgres`
- DB name: `jta`

`expect` と `ssh` を使う場合は、SQL 作成から実行までを一連で扱い、途中ファイルの取り扱いに注意する。

### 9. 反映確認

DB更新後、対象 chapter の `question` と `correct_answer` を確認する。可能ならアプリ画面でも対象章を開いて、更新後の問題文・選択肢・正解が表示されることを確認する。

### 10. 報告

- 書き換えた問題数
- 定義型からシナリオ型への変換数
- 章テーマとの整合性
- 更新したMDファイル
- SQL更新の成否
- DB/アプリ反映の成否

## 注意事項

- 固有名詞を避ける
- 資料にない内容を創作しない
- 正解文が循環していないか確認する
- 強い断定や具体数字は出典で裏付ける
