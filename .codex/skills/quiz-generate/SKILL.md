---
name: quiz-generate
description: JTAクイズアプリ用のクイズをナレッジMDから生成する。コース（kohaku/kohana）とWeek番号を選び、該当セクションの知識から20問の4択クイズ+解説をMarkdownで出力する。トリガー：「クイズ生成」「クイズを作って」「Week Xのクイズ」「quiz generate」など、クイズ作成に関する依頼。
---

# Quiz Generate

JTAナレッジベースから高品質な4択クイズを生成する。

## 前提

- ナレッジファイル:
  - `docs/lite-kohaku_knowledge_v3.md`
  - `docs/basic-pro-kohana_knowledge_v3.md`
- 講義資料:
  - `docs/講義資料/01_入門講座_駆け込み寺.md`
  - `docs/講義資料/` 配下の該当ファイル
- 出力先: `docs/quizzes/{course}/week-{NN}.md`
- 1ファイル = 1 Week = 20問。別の問題数を指定されたらそちらを優先する

## 手順

### 1. コースとWeekの確認

ユーザーにコースとWeek番号を確認する。未指定なら直接確認する。

- `kohaku` — 入門講座（駆け込み寺）
- `kohana` — Basic講座（STRADA）

### 2. ナレッジの読み込み

該当Weekのセクションを読み取る。

- kohaku: `### Week N` から次の `###` まで
- kohana: `#### タイトル（Week N）` から次の `####` まで

必要に応じて講義資料も参照し、内容を理解してから出題する。

### 3. クイズ生成

以下のルールに従う。

#### 文面のルール

- 問題文・解説に「講義では」「ナレッジでは」など資料前提の表現を入れない
- 不正解ももっともらしい選択肢にする

#### 質の基準

- 網羅性: そのWeekの主要ポイントを広くカバーする
- 深さ: 用語確認5問前後、概念理解8問前後、応用判断7問前後
- 正解位置: A〜Dを均等に近づける
- 解説: 1〜2文で簡潔に理由を書く
- 実践性: 実際のトレーダーが直面する場面を含める

#### 避けるべきパターン

- 曖昧な問い方
- 極端な表現
- 資料にない内容からの出題
- 数値の丸暗記だけを問う出題
- 資料の存在を前提にした問い方

### 4. 出力

`docs/quizzes/{course}/week-{NN}.md` に次の形式で書き出す。

```markdown
---
course: kohaku
week: 1
title: "なぜ負けるのか — 9割が退場する本当の理由"
chapter_id: null
available_for_light: false
---
```

本文は `# Week ...` と `## Q1` 以降の問題セットで構成する。

フロントマター:

- `course`: `kohaku` または `kohana`
- `week`: Week番号
- `title`: Weekタイトル
- `chapter_id`: 不明なら `null`
- `available_for_light`: デフォルト `false`

### 5. 確認

生成後に報告する内容:

- 出力ファイルパス
- 問題数
- 正解の分布
- 難易度の分布
