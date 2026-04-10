# JTA App VPS Deploy Design

Date: 2026-04-10

## Overview

quiz-app (JTA-App-POC) の本番Docker構成を jta-app に移管し、Cloudflare Tunnel 経由で VPS デプロイできるようにする。

## Background

- quiz-app は `docker-compose.prod.yml` + Cloudflare Tunnel で `https://study-app.87pedia.com` に公開されている
- jta-app は開発用の `docker-compose.yml`（DB のみ）しかなく、本番構成がない
- jta-app は quiz-app を置き換える形でデプロイする

## Architecture

```
Cloudflare Tunnel → localhost:8000
                          ↓
┌──────────────────────────────────────┐
│ VPS (docker-compose.prod.yml)        │
│                                      │
│  ┌──────────┐     ┌──────────────┐  │
│  │ client   │ ──→ │ server       │  │
│  │ Vite     │     │ Express      │  │
│  │ :8000    │     │ :3001        │  │
│  └──────────┘     └──────────────┘  │
│                         ↓           │
│                   ┌──────────────┐  │
│                   │ db           │  │
│                   │ PostgreSQL   │  │
│                   │ :5432        │  │
│                   └──────────────┘  │
└──────────────────────────────────────┘
```

quiz-app と同じ 3 サービス構成（Vite dev server + Express + PostgreSQL）。

## Design Decisions

### Vite dev server を本番で使う

- Cloudflare Tunnel の裏にいるため直接インターネットに晒されない
- チーム数人のクローズド利用
- quiz-app で実績あり、変更理由がない

### migrate は自動、seed は手動

- `server/Dockerfile` の CMD で `npm run migrate && node src/index.js` を実行
- seed は手動（`docker exec jta-server npm run seed`）
- 理由: seed ファイルが `DELETE FROM user_quiz_progress` で始まるため、コンテナ再起動時にユーザーデータが消えてしまう

### JWT 期限は 7 日のまま

- 将来 FINCS 認証を導入予定
- 現状は `autoDemoLogin` で自動ユーザー作成（認証スキップ）
- 7 日後は新しい dev ユーザーが作られ進捗リセットされるが、POC 段階では許容

### Express ポートは 3001

- jta-app の既存設定に合わせる（quiz-app は 3000 だった）

### DB 接続は DATABASE_URL で統一

- `db.js` は `process.env.DATABASE_URL` を使う（変更なし）
- `docker-compose.prod.yml` の server 環境変数で `DATABASE_URL` を構築して渡す
- 個別の `POSTGRES_*` 変数は DB コンテナ用のみ

### マイグレーションは冪等であること

- `migrate.js` はすべての `.sql` を毎回実行するため、各マイグレーションは `CREATE TABLE IF NOT EXISTS` 等の冪等な書き方にすること
- 将来 `ALTER TABLE` 等の破壊的マイグレーションが必要になったら、`schema_migrations` テーブルによる追跡を導入する

## Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `server/Dockerfile` | node:20-alpine, migrate → start |
| `client/Dockerfile` | node:20-alpine, Vite dev server on :8000 |
| `docker-compose.prod.yml` | 3 services: db, server, client |
| `.env.example` | VPS 設定用テンプレート |
| `DEPLOY.md` | jta-app 用デプロイ手順 |

### Modified Files

| File | Change |
|------|--------|
| `client/vite.config.js` | `PROXY_TARGET` 環境変数対応 + `VITE_PORT` 対応を追加 |

### Unchanged

- サーバーコード（ルーティング、認証等）
- クライアントコード
- 既存 `docker-compose.yml`（dev 用）

## File Details

### server/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npm run migrate && node src/index.js"]
```

### client/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json vite.config.js ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev", "--", "--host"]
```

### client/vite.config.js (diff)

```js
server: {
  port: parseInt(process.env.VITE_PORT || '5173'),
  host: true,
  allowedHosts: true,
  proxy: {
    '/api': {
      target: process.env.PROXY_TARGET || 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    }
  },
},
```

### docker-compose.prod.yml

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: jta-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-jta}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - jta-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  server:
    build: ./server
    container_name: jta-server
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-jta}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    depends_on:
      db:
        condition: service_healthy
    networks:
      - jta-network

  client:
    build: ./client
    container_name: jta-client
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - VITE_PORT=8000
      - PROXY_TARGET=http://server:3001
    depends_on:
      - server
    networks:
      - jta-network

networks:
  jta-network:
    driver: bridge

volumes:
  postgres_data:
```

### .env.example

```
JWT_SECRET=change-me-to-a-strong-random-string
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=jta
```

### DEPLOY.md

quiz-app の DEPLOY.md をベースに jta-app 用に書き換え:
- ゲートパスワード / パスキー認証の記述を削除
- 初回 seed 手順を追加（`docker exec jta-server npm run seed`）
- コンテナ名を jta-* に変更
- .env テンプレートに JWT_SECRET を追加

## Deploy Procedure

1. VPS に SSH 接続
2. `git clone` or `git pull`
3. `.env` を設定（JWT_SECRET を強いランダム文字列に）
4. `docker compose -f docker-compose.prod.yml up -d --build`
5. 初回のみ: `docker exec jta-server npm run seed`
6. ブラウザで URL にアクセス → 自動ログインされる
