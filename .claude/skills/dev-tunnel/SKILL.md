---
name: dev-tunnel
description: Start the JTA app dev environment (Express + Vite) and open a cloudflared tunnel. Use when the user says "トンネル繋いで", "tunnel", "アプリ見せて", "external URL", "外から見たい", or wants to share the local dev app via a public URL. Also triggers on "ローカル立てて", "dev server起動" combined with sharing/viewing externally.
---

# Dev Tunnel

Start the full JTA dev environment and expose it via cloudflared tunnel.

## Steps

1. **Check existing processes** — Before starting anything, check what's already running:
   ```bash
   lsof -i :3001 -P -n | grep LISTEN   # Express
   lsof -i :5173 -P -n | grep LISTEN   # Vite
   ```
   If both are already listening, skip to step 4.

2. **Start Express server** (background) — only if :3001 is not in use:
   ```bash
   cd /Users/neil/Desktop/dev/apps/jta-app/server && npm run dev
   ```
   Run in background. Wait ~2s, then verify :3001 is listening.

3. **Start Vite dev server** (background) — only if :5173 is not in use:
   ```bash
   cd /Users/neil/Desktop/dev/apps/jta-app/client && npm run dev
   ```
   Run in background. Wait ~3s, then verify :5173 is listening.

4. **Start cloudflared tunnel** — Route through the Vite dev server (it proxies `/api` to Express):
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
   Run in background. Wait ~5s, then extract the tunnel URL from the output:
   ```bash
   grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com'
   ```

5. **Output the URL** — Present the tunnel URL to the user. Tell them the API requests are proxied through Vite so everything works via the single URL.

## Important notes

- Vite's proxy config (in `client/vite.config.js`) forwards `/api/*` to `http://localhost:3001`, so only the Vite port needs to be tunneled.
- Docker PostgreSQL (:5432) must be running separately. If DB connection fails, remind the user to run `docker compose up -d`.
- `cloudflared` is expected at `/opt/homebrew/bin/cloudflared` (installed via Homebrew).
