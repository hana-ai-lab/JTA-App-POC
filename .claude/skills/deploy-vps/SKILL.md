---
name: deploy-vps
description: Deploys the JTA App to the VPS server (85.131.249.99). Use when the user asks to deploy the application or update the production environment.
---

# Deploy to VPS Skill

This skill automates the deployment of the JTA App to the production VPS.

## Usage

To deploy the application, run the following command from the project root:

```bash
./.claude/skills/deploy-vps/scripts/deploy.sh
```

## Prerequisites

- **OS**: macOS (or Linux with `expect` installed)
- **Dependencies**:
  - `expect`: Used for automating SSH password entry.
  - `rsync`: Used for efficient file transfer.
- **Network**: Must have SSH access to `85.131.249.99` (Port 22).

## What the Script Does

1.  **File Transfer**: Syncs local files to `/root/jta-app` on the VPS using `rsync`.
    -   Excludes: `node_modules`, `.git`, `.env`, `postgres_data`, `e2e`
2.  **Container Update**: Connects via SSH and runs `docker compose -f docker-compose.prod.yml up -d --build`.
    -   Existing database data is preserved in the `postgres_data` volume.
    -   Only changed containers are recreated.

## Configuration

- **Server IP**: `85.131.249.99`
- **User**: `root`
- **Target Directory**: `/root/jta-app`

## First Deploy Only

After the first deployment, run seed manually:

```bash
docker exec jta-server npm run seed
```

## Troubleshooting

-   **502 Bad Gateway**: Wait a few seconds after deployment for containers to fully start.
-   **DB connection error**: Check that `jta-db` container is healthy before `jta-server` starts.

## Safety Notes

-   The automation script `scripts/deploy.exp` contains the VPS password. Ensure this file is not committed to public repositories (it should be in `.gitignore`).
