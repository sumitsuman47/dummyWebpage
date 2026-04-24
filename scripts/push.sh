#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# push.sh — Push changes to BOTH repos in one command
#
# Usage:
#   ./scripts/push.sh
#   ./scripts/push.sh --private-only    # only private backup
#   ./scripts/push.sh --public-only     # only GitHub Pages
#
# Repos:
#   origin  → sumitsuman47/Lumitya_web    (PRIVATE — full project backup)
#   pages   → sumitsuman47/dummyWebpage   (PUBLIC  — frontend only, GitHub Pages)
#
# How the public push works:
#   Uses `git subtree split` to extract just the public/ folder history
#   and force-pushes it as the root of the dummyWebpage repo.
#   This means dummyWebpage only ever sees index.html, css/, js/, images/ —
#   never server/, docs/, sql/, .env.example, render.yaml etc.
# ─────────────────────────────────────────────────────────────────────────────

set -e  # exit immediately on any error

MODE="${1:-both}"   # default: push to both

echo ""
echo "🚀 Lumitya — Push"
echo "────────────────────────────────────────"

# ── 1. PRIVATE BACKUP (full project) ─────────────────────────────────────────
if [[ "$MODE" == "both" || "$MODE" == "--private-only" ]]; then
  echo ""
  echo "📦 [1/2] Pushing full project to private backup…"
  echo "    → origin (sumitsuman47/Lumitya_web)"
  git push origin main
  echo "    ✅ Private backup up to date."
fi

# ── 2. PUBLIC FRONTEND (public/ folder only) ──────────────────────────────────
if [[ "$MODE" == "both" || "$MODE" == "--public-only" ]]; then
  echo ""
  echo "🌐 [2/2] Pushing public/ frontend to GitHub Pages repo…"
  echo "    → pages (sumitsuman47/dummyWebpage)"
  echo "    (extracting only public/ folder — no server code, no secrets)"
  echo ""

  # Split out the public/ subtree into a temporary synthetic commit.
  # This commit contains ONLY the public/ directory contents at the repo root.
  SPLIT_COMMIT=$(git subtree split --prefix public HEAD)

  # Force-push that commit as main on the public repo.
  git push pages "${SPLIT_COMMIT}":main --force

  echo ""
  echo "    ✅ Public frontend pushed to dummyWebpage."
  echo "    🔗 GitHub Pages URL will be: https://sumitsuman47.github.io/dummyWebpage"
  echo "    📌 Make sure GitHub Pages is enabled: repo Settings → Pages → Branch: main / (root)"
fi

echo ""
echo "────────────────────────────────────────"
echo "✅ Done."
echo ""
