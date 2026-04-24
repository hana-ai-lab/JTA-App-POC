#!/bin/bash

set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)/.codex/skills"
TARGET_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$TARGET_DIR"

for skill_dir in "$SOURCE_DIR"/*; do
    [ -d "$skill_dir" ] || continue
    skill_name="$(basename "$skill_dir")"
    rm -rf "$TARGET_DIR/$skill_name"
    cp -R "$skill_dir" "$TARGET_DIR/$skill_name"
    echo "Installed $skill_name"
done
