# VPS Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** jta-app を Cloudflare Tunnel 経由で VPS にデプロイできる Docker 本番構成を作る。

**Architecture:** quiz-app と同じ 3 サービス構成（PostgreSQL + Express + Vite dev server）。Cloudflare Tunnel が localhost:8000 に接続し、Vite がフロントエンド配信 + API プロキシを担う。

**Tech Stack:** Docker, docker-compose, Node 20, Vite, Express, PostgreSQL 15

**Spec:** `docs/superpowers/specs/2026-04-10-vps-deploy-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/vite.config.js` | Modify | `VITE_PORT` + `PROXY_TARGET` 環境変数対応 |
| `server/Dockerfile` | Create | Express サーバーコンテナ（migrate → start） |
| `client/Dockerfile` | Create | Vite dev server コンテナ（:8000） |
| `docker-compose.prod.yml` | Create | 3 サービス定義（db, server, client） |
| `.env.example` | Create | VPS 設定テンプレート |
| `DEPLOY.md` | Create | デプロイ手順書 |

---

### Task 1: vite.config.js を環境変数対応にする

**Files:**
- Modify: `client/vite.config.js`

- [ ] **Step 1: vite.config.js を更新**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

- [ ] **Step 2: ローカルで動作確認**

Run: `cd client && npx vite --host --port 5173`

Expected: Vite が 5173 で起動する（既存の動作と同じ）。Ctrl+C で止める。

- [ ] **Step 3: Commit**

```bash
git add client/vite.config.js
git commit -m "feat: add VITE_PORT and PROXY_TARGET env var support to vite config"
```

---

### Task 2: server/Dockerfile を作成する

**Files:**
- Create: `server/Dockerfile`

- [ ] **Step 1: Dockerfile を作成**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npm run migrate && node src/index.js"]
```

- [ ] **Step 2: Commit**

```bash
git add server/Dockerfile
git commit -m "feat: add server Dockerfile for production"
```

---

### Task 3: client/Dockerfile を作成する

**Files:**
- Create: `client/Dockerfile`

- [ ] **Step 1: Dockerfile を作成**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json vite.config.js ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev", "--", "--host"]
```

- [ ] **Step 2: Commit**

```bash
git add client/Dockerfile
git commit -m "feat: add client Dockerfile for production"
```

---

### Task 4: docker-compose.prod.yml を作成する

**Files:**
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: docker-compose.prod.yml を作成**

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

- [ ] **Step 2: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add docker-compose.prod.yml for VPS deployment"
```

---

### Task 5: .env.example を作成する

**Files:**
- Create: `.env.example`

- [ ] **Step 1: .env.example を作成**

```
JWT_SECRET=change-me-to-a-strong-random-string
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=jta
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add .env.example for VPS setup"
```

---

### Task 6: DEPLOY.md を作成する

**Files:**
- Create: `DEPLOY.md`
- Reference: quiz-app の `DEPLOY.md`（`/Users/neil/Desktop/dev/apps/quiz-app/DEPLOY.md`）

- [ ] **Step 1: DEPLOY.md を作成**

quiz-app の DEPLOY.md をベースに、jta-app 用に書き換える。内容：

- 設定情報（URL, Tunnel 接続先）
- デプロイ手順（SSH → clone → .env → docker compose up → seed）
- よく使うコマンド（ログ確認、再起動、停止、更新）
- トラブルシューティング
- 構成図

変更点：
- コンテナ名を `jta-*` に
- ゲートパスワード / パスキー認証の記述を削除
- `.env` に `JWT_SECRET` を追加
- 初回 seed 手順を追加（`docker exec jta-server npm run seed`）
- Step 5 の動作確認を「URL にアクセス → 自動ログイン → ダッシュボード表示」に変更

- [ ] **Step 2: 必要な内容が含まれているか確認**

Run: `grep -E "jta-server|npm run seed|JWT_SECRET" DEPLOY.md`

Expected: 3 行すべてにマッチがある。

- [ ] **Step 3: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: add VPS deployment guide"
```

---

### Task 7: ローカル Docker ビルド検証

**Files:** なし（検証のみ）

- [ ] **Step 1: Docker ビルドが通ることを確認**

Run: `docker compose -f docker-compose.prod.yml build`

Expected: 3 サービスすべてのビルドが成功する。

- [ ] **Step 2: コンテナ起動確認（オプション、ローカルにDockerがあれば）**

Run:
```bash
echo "JWT_SECRET=dev-test-secret" > .env.local-test
echo "POSTGRES_PASSWORD=testpass" >> .env.local-test
docker compose -f docker-compose.prod.yml --env-file .env.local-test up -d
docker compose -f docker-compose.prod.yml ps
```

Expected: 3 サービスすべてが `running` 状態。

- [ ] **Step 3: seed 実行確認（オプション）**

Run: `docker exec jta-server npm run seed`

Expected: `Seed complete` と出力される。

- [ ] **Step 4: クリーンアップ**

Run:
```bash
docker compose -f docker-compose.prod.yml down -v
rm .env.local-test
```
