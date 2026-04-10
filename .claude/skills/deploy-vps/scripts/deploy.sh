#!/bin/bash

# Wrapper script for deployment
echo "Starting deployment to VPS..."

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    echo "Error: expect is not installed."
    exit 1
fi

# Run the expect script
expect .claude/skills/deploy-vps/scripts/deploy.exp

echo "Deployment process finished."
