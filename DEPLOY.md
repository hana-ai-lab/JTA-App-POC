# jta-app デプロイ手順

**Cloudflare Tunnel 経由でデプロイする手順です。**
nginx や SSL 証明書の設定は不要！Cloudflare が HTTPS を自動で処理します。

---

## 設定情報

| 項目         | 値                    |
| :----------- | :-------------------- |
| Tunnel接続先 | localhost:8000        |

---

## デプロイ手順

### Step 1: VPS に SSH 接続

```bash
ssh root@VPSのIPアドレス
```

---

### Step 2: アプリをダウンロード

```bash
mkdir /root/jta-app
cd /root/jta-app
git clone <リポジトリURL> .
```

---

### Step 3: 環境変数を設定

`.env.example` をコピーして編集する：

```bash
cp .env.example .env
```

以下の値を実際の値に変更してください：

```bash
cat > .env << 'EOF'
JWT_SECRET=ここに強いランダム文字列を入力
POSTGRES_USER=postgres
POSTGRES_PASSWORD=強いパスワードに変更
POSTGRES_DB=jta
EOF
```

---

### Step 4: アプリを起動

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

初回は 2〜3 分かかります。

```bash
# 状態確認
docker compose -f docker-compose.prod.yml ps
```

成功の目安: 全てのサービスが `running` と表示される

---

### Step 5: 初回 seed 実行

```bash
docker exec jta-server npm run seed
```

`Seed complete` と出力されれば OK。

---

### Step 6: 動作確認

ブラウザでアプリの URL にアクセス！

1. 自動ログイン
2. ダッシュボードが表示されれば **完了！**

---

## よく使うコマンド

```bash
cd /root/jta-app

# ログを見る
docker compose -f docker-compose.prod.yml logs -f

# 特定サービスのログ
docker compose -f docker-compose.prod.yml logs -f jta-server

# 再起動
docker compose -f docker-compose.prod.yml restart

# 停止
docker compose -f docker-compose.prod.yml down

# 最新版に更新
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## トラブルシューティング

### アプリにアクセスできない

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### DB 接続エラー

- `.env` の `POSTGRES_PASSWORD` が正しいか確認
- `jta-db` コンテナが `running` になっているか確認

```bash
docker compose -f docker-compose.prod.yml logs db
```

---

## 構成図

```
ブラウザ
    ↓ HTTPS (Cloudflare)
Cloudflare Tunnel
    ↓ localhost:8000
┌─────────────────────────────────┐
│ VPS                             │
│  ┌─────────┐     ┌──────────┐  │
│  │ Vite    │ ──→ │ Express  │  │
│  │ :8000   │     │ :3001    │  │
│  └─────────┘     └──────────┘  │
│                       ↓        │
│               ┌──────────────┐ │
│               │ PostgreSQL   │ │
│               │    :5432     │ │
│               └──────────────┘ │
└─────────────────────────────────┘
```
