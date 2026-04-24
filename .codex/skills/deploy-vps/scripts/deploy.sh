#!/bin/bash

echo "Starting deployment to VPS..."

if ! command -v expect >/dev/null 2>&1; then
    echo "Error: expect is not installed."
    exit 1
fi

expect .codex/skills/deploy-vps/scripts/deploy.exp

echo "Deployment process finished."
