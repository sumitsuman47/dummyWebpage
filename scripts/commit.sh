#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# commit.sh — Stage all changes and commit with a message
#
# Usage:
#   ./scripts/commit.sh "your commit message"
#
# What it does:
#   1. git add -A  (stages everything not in .gitignore)
#   2. git commit  with your message
# ─────────────────────────────────────────────────────────────────────────────

set -e  # exit immediately on any error

# ── Require a commit message ──────────────────────────────────────────────────
if [ -z "$1" ]; then
  echo ""
  echo "❌  No commit message provided."
  echo "    Usage: ./scripts/commit.sh \"your commit message\""
  echo ""
  exit 1
fi

MSG="$1"

echo ""
echo "📝 Lumitya — Commit"
echo "────────────────────────────────────────"

# ── Show what will be staged ──────────────────────────────────────────────────
echo "📋 Changes to be committed:"
git status --short
echo ""

# ── Stage all ─────────────────────────────────────────────────────────────────
git add -A
echo "✅ All changes staged."

# ── Commit ────────────────────────────────────────────────────────────────────
git commit -m "$MSG"
echo ""
echo "✅ Committed: \"$MSG\""
echo ""
echo "💡 Run ./scripts/push.sh to push to both repos."
echo ""
