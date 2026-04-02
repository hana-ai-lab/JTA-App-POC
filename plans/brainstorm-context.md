# JTA クイズアプリ ブレインストーミング記録

## ステータス: ブレインストーミング進行中（質問フェーズ前）

- プロジェクトコンテキスト探索: 完了
- ビジュアルコンパニオン提案: ユーザー回答待ち
- 明確化の質問: 未着手
- アプローチ提案: 未着手
- 設計提示: 未着手

---

## 1. プロジェクト概要

- **作業ディレクトリ**: `/Users/neil/Desktop/dev/apps/jta-app/`（現在ほぼ空、`plans/` のみ）
- **クイズデータ元**: `/Users/neil/Desktop/dev/apps/quiz-app/docs/quizzes.md`
- **テーマカラー**: 白 + 深い藍色
- **初期規模**: 20問程度で骨格を作り、後から章構成やクイズを追加

---

## 2. 要件定義（v0.1）ユーザー提供

### コンテンツ構成
- 教材は「章」で構成
- 各章に複数のクイズ（4択）

### クイズデータ
```
id, chapter_id, question, choices[4], correct_answer
```

### ユーザーデータ

問題ごとの進捗:
```
correct_streak: int        # 連続正解数
next_due_at: datetime|null # 次の出題タイミング
seen: bool                 # 解いたことがあるか
```

ユーザー単位:
```
last_played_at: datetime   # 最終プレイ時刻
streak_days: int           # 連続日数
level: int                 # レベル
exp: int                   # 経験値
```

### 出題ロジック

優先順位:
1. 復習（next_due_at <= now）
2. 間違い問題（correct_streak == 0）
3. 未出題（seen == false）

セッション生成（1回5問）:
```
復習件数 >= 20 → 新規 0問
復習件数 >= 10 → 新規 1問
それ以外       → 新規 最大2問
残りは復習で埋める
```

### 回答後の更新

正解:
```
correct_streak += 1
1回目 → +1日
2回目 → +3日
3回目 → +7日
4回目以降 → 卒業（出題しない）
```

不正解:
```
correct_streak = 0
next_due_at = now + 10分
```

### モード設計

1. メイン（おすすめ）: 復習+新規を自動で混ぜる
2. 章モード: 未出題の問題を順に出す → 解いた問題は通常ロジックに合流

### UI構成

- ホーム: メインボタン（状態でラベル変化）、ストリーク表示、レベル/経験値
- 章画面: 章一覧、各章の進捗表示、タップで章モード開始
- 進捗画面: 全体進捗、レベル/経験値、正答率

### ストリーク仕様
- 1日1回以上プレイで継続
- 日付は `last_played_at` で判定

### 設計方針
- 復習を自動で混ぜる（ユーザーに意識させない）
- 新規は制御するが完全には止めない
- 章は補助、メインはおすすめ
- 表示はシンプル

---

## 3. 既存 quiz-app の調査結果

### 技術スタック
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Express.js (Node.js 18+) |
| Database | PostgreSQL 15 |
| Auth | WebAuthn / Passkeys (@simplewebauthn) |
| Infra | Docker Compose / Cloudflare Tunnel (本番) |

### コンテンツ階層
```
Block → Theme → Chapter → Quiz
```
- Block1: 標準クイズ（選択式+解説）
- Block2: トレーディングシナリオシミュレーション

### XPシステム
| Action | XP |
|--------|-----|
| 新規正解 | +10 |
| 復習正解 | +5 |
| チャプター完了 | +50 (ボーナス) |
| レベルアップ | 100 XP ごと |

### 主要API
| Route | Endpoint | Description |
|-------|----------|-------------|
| gate.js | `/api/gate` | 共有パスワード検証 |
| auth.js | `/api/auth` | WebAuthn 登録・ログイン |
| content.js | `/api/content` | コンテンツツリー取得 |
| learning.js | `/api/learning` | クイズ結果同期・XP・進捗更新 |
| admin.js | `/api/admin` | ユーザー・クイズ管理 |
| user.js | `/api/user` | プロフィール更新 |
| block2.js | `/api/block2` | Block2 シナリオ管理 |

### DBキーテーブル
- `users` — username, xp, level, goal, style_id, is_admin, streak情報
- `user_credentials` — WebAuthn資格情報
- `blocks / themes / chapters / quizzes` — コンテンツ階層
- `user_quiz_results` — クイズ回答履歴
- `user_chapter_progress` — チャプター完了記録
- `settings` — gate_hash, gate_version

### クライアント構成
- `client/src/main.jsx` — アプリルート、認証フロー制御
- `client/src/pages/Dashboard.jsx` — メイン学習UI
- `client/src/pages/Preview.jsx` — モックデータによるプレビュー
- `client/src/components/QuizModal.jsx` — Block1クイズUI
- `client/src/components/Block2QuizModal.jsx` — Block2シナリオUI

### 認証フロー
```
Gate（共有パスワード）→ Auth（WebAuthn）→ Onboarding（目標・スタイル設定）→ Dashboard
```

---

## 4. クイズデータの構造（quizzes.md）

ファイルパス: `/Users/neil/Desktop/dev/apps/quiz-app/docs/quizzes.md`
（非常に大きいファイル、83,000+ トークン）

### フォーマット
```markdown
# 初級：トレード基礎マスター

## Stage 1：基礎知識の習得

### トレードの仕組みと学習ロードマップ

**[Q_BEG_1_1] 質問テキスト？**

　 1. 選択肢A
✅ 2. 選択肢B（正解）
　 3. 選択肢C
　 4. 選択肢D
```

### ID体系
- `Q_BEG_X_Y` — 初級、Stage X、問題 Y
- 各Stageに5問ずつ
- 確認済みStage: 1〜6+（最低30問以上存在）

### 確認済み章タイトル（Stage 1内）
1. トレードの仕組みと学習ロードマップ
2. 証券口座とチャート分析ツールの準備
3. 注文の三種の神器：成行・指値・逆指値
4. ローソク足の基本：1本が語る物語
5. 陽線・陰線・ヒゲが映す投資家心理
6. 損切りの鉄則：破産を防ぐ最重要スキル

---

## 5. 新旧の主な差分

| 項目 | 既存 quiz-app | 新 jta-app 要件 |
|------|--------------|----------------|
| 階層 | Block → Theme → Chapter → Quiz | Chapter → Quiz（シンプル） |
| 復習 | user_quiz_results に履歴あるが SRS 未実装？ | SRS（間隔反復）を組み込み |
| 出題 | コンテンツツリー順？ | 復習優先 + 新規制御ロジック |
| セッション | 不明 | 1回5問、復習/新規比率を自動制御 |
| モード | Block1/Block2 | メイン（おすすめ）/ 章モード |
| UI | Dashboard + コンテンツツリー | ホーム + 章画面 + 進捗画面 |
| テーマ | 不明 | 白 + 深い藍色 |

---

## 6. 次のステップ

ブレインストーミングの続き:
1. **ビジュアルコンパニオン**: ユーザーに提案済み（回答待ち）
2. **明確化の質問**（1つずつ）:
   - 技術スタック: 既存と同じ（React+Express+PostgreSQL）か、別の選択肢か？
   - デプロイ先: 同じくDocker+Cloudflare Tunnelか？
   - ターゲットデバイス: モバイルファースト？デスクトップ？
   - 認証: WebAuthn継続？FINCS連携前提？シンプルにする？
   - 既存quiz-appとの関係: 完全リプレイス？並行運用？
   - データ移行: 既存ユーザーデータの引き継ぎは？
3. **2-3のアプローチ提案**
4. **設計提示 → 承認**
5. **設計ドキュメント作成**
6. **実装計画へ移行**
