---
name: dev-tunnel
description: Start the JTA app dev environment (Express + Vite) and open a cloudflared tunnel. Use when the user says "トンネル繋いで", "tunnel", "アプリ見せて", "external URL", "外から見たい", or wants to share the local dev app via a public URL. Also triggers on "ローカル立てて", "dev server起動" combined with sharing/viewing externally.
---

# Dev Tunnel

Start the full JTA dev environment and expose it through cloudflared.

## Steps

1. Check existing listeners:
   ```bash
   lsof -i :3001 -P -n | grep LISTEN
   lsof -i :5173 -P -n | grep LISTEN
   ```
   If both are already running, skip to the tunnel step.

2. Start Express if `:3001` is free:
   ```bash
   cd /Users/neil/Desktop/dev/apps/jta-app/server && npm run dev
   ```
   Run it in the background, wait about 2 seconds, then verify the port is open.

3. Start Vite if `:5173` is free:
   ```bash
   cd /Users/neil/Desktop/dev/apps/jta-app/client && npm run dev
   ```
   Run it in the background, wait about 3 seconds, then verify the port is open.

4. Start the tunnel through Vite:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
   Run it in the background, wait about 5 seconds, then extract the URL:
   ```bash
   grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com'
   ```

5. Return the public URL and mention that Vite proxies `/api` to Express.

## Important Notes

- `client/vite.config.js` proxies `/api/*` to `http://localhost:3001`, so tunneling Vite is enough.
- PostgreSQL in Docker on `:5432` must already be running. If DB access fails, run `docker compose up -d`.
- `cloudflared` is expected at `/opt/homebrew/bin/cloudflared`.
