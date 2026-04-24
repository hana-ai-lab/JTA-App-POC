---
name: deploy-vps
description: Deploys the JTA App to the VPS server (85.131.249.99). Use when the user asks to deploy the application or update the production environment.
---

# Deploy to VPS Skill

This skill automates deployment of the JTA App to the production VPS.

## Usage

Run this command from the project root:

```bash
bash ./.codex/skills/deploy-vps/scripts/deploy.sh
```

## Prerequisites

- OS: macOS or Linux with `expect` installed
- Dependencies:
  - `expect` for SSH password automation
  - `rsync` for file transfer
- Network: SSH access to `85.131.249.99` on port 22

## What the Script Does

1. Sync local files to `/root/jta-app` with `rsync`
   - Excludes `node_modules`, `.git`, `.env`, `postgres_data`, `e2e`
2. SSH to the server and run `docker compose -f docker-compose.prod.yml up -d --build`
   - Existing DB data in `postgres_data` is preserved
   - Only changed containers are recreated

## Configuration

- Server IP: `85.131.249.99`
- User: `root`
- Target directory: `/root/jta-app`

## First Deploy Only

After the first deployment, run seed manually:

```bash
docker exec jta-server npm run seed
```

## Troubleshooting

- `502 Bad Gateway`: wait a few seconds for containers to start
- DB connection errors: confirm `jta-db` is healthy before `jta-server` starts

## Safety Notes

- `scripts/deploy.exp` contains the VPS password. Do not move this skill into a public repository.
