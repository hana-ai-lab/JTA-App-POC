---
name: dev-disconnect
description: Stop the JTA app dev tunnel and dev servers. Use when the user says "トンネル切って", "切り離して", "disconnect", "tunnel止めて", "devサーバー止めて", "URL使えなくして", "落として", or wants to stop the cloudflared tunnel and/or Vite/Express dev servers. Also triggers on "トンネル閉じて", "サーバー停止", "kill tunnel", "stop dev".
---

# Dev Disconnect

Stop the JTA dev environment: cloudflared tunnel, Vite dev server, and Express server.

## Steps

1. Find running processes:
   ```bash
   ps aux | grep -E 'cloudflared|vite|node.*server' | grep -v grep | grep -v 'Visual Studio'
   ```
   Identify:
   - `cloudflared tunnel`
   - `vite`
   - `node` processes running the Express server from the JTA app

2. Stop the processes:
   ```bash
   kill <pid1> <pid2> ...
   ```
   Use normal `kill` first. Use `kill -9` only if a process survives.

3. Verify cleanup:
   ```bash
   ps aux | grep -E 'cloudflared|vite' | grep -v grep | grep -v 'Visual Studio'
   ```
   Optional port checks:
   ```bash
   lsof -i :5173 -P -n | grep LISTEN
   lsof -i :3001 -P -n | grep LISTEN
   ```

4. Report that the tunnel and servers have stopped.

## Important Notes

- There may be multiple leftover Vite processes. Stop all of them.
- Exclude unrelated `node` processes such as editor extensions or TypeScript servers.
- Do not stop Docker or PostgreSQL.
