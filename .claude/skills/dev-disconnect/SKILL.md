---
name: dev-disconnect
description: Stop the JTA app dev tunnel and dev servers. Use when the user says "トンネル切って", "切り離して", "disconnect", "tunnel止めて", "devサーバー止めて", "URL使えなくして", "落として", or wants to stop the cloudflared tunnel and/or Vite/Express dev servers. Also triggers on "トンネル閉じて", "サーバー停止", "kill tunnel", "stop dev".
---

# Dev Disconnect

Stop the JTA dev environment: cloudflared tunnel, Vite dev server, and Express server.

## Steps

1. **Find running processes** — Identify cloudflared, Vite, and Express processes:
   ```bash
   ps aux | grep -E 'cloudflared|vite|node.*server' | grep -v grep | grep -v 'Visual Studio'
   ```
   Extract the PIDs for:
   - `cloudflared tunnel` processes
   - `vite` dev server processes (may be multiple from previous sessions)
   - `node` Express server processes running from the jta-app/server directory

2. **Kill the processes** — Stop them all with a single `kill` command:
   ```bash
   kill <pid1> <pid2> ...
   ```
   Use regular `kill` (SIGTERM) first. Only escalate to `kill -9` if processes survive after a few seconds.

3. **Verify cleanup** — Confirm everything is stopped:
   ```bash
   ps aux | grep -E 'cloudflared|vite' | grep -v grep | grep -v 'Visual Studio'
   ```
   Also optionally check ports are free:
   ```bash
   lsof -i :5173 -P -n | grep LISTEN
   lsof -i :3001 -P -n | grep LISTEN
   ```

4. **Report** — Tell the user that the tunnel and servers have been stopped.

## Important notes

- There may be multiple Vite processes from previous sessions that weren't cleaned up. Kill all of them.
- Be careful to exclude unrelated `node` processes (e.g., VS Code extensions, TypeScript server). Filter by jta-app paths or known command patterns.
- Do NOT stop Docker/PostgreSQL — the DB container is managed separately.
