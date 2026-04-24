#!/usr/bin/env bash
# scripts/clean-public.sh
# Scans public/ for files not referenced anywhere in source, then removes them.
# Usage:
#   bash scripts/clean-public.sh          # dry-run (shows what would be deleted)
#   bash scripts/clean-public.sh --delete # actually deletes unused files
#
# A file is considered "used" if its basename appears anywhere in:
#   app/ components/ hooks/ lib/ providers/ data/ config/ contexts/ types/
# in .ts .tsx .js .jsx .css .json files.
#
# Files always kept regardless of references:
#   favicon.ico, manifest.json, manifest.webmanifest, sw.js, robots.txt

set -eo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_ROOT/public"
DELETE=false

[[ "${1:-}" == "--delete" ]] && DELETE=true

# Directories to search for source references
SEARCH_DIRS=(
  "$PROJECT_ROOT/app"
  "$PROJECT_ROOT/components"
  "$PROJECT_ROOT/hooks"
  "$PROJECT_ROOT/lib"
  "$PROJECT_ROOT/providers"
  "$PROJECT_ROOT/data"
  "$PROJECT_ROOT/config"
  "$PROJECT_ROOT/contexts"
  "$PROJECT_ROOT/types"
)

# Files to always keep (system / PWA essentials)
ALWAYS_KEEP=(
  "favicon.ico"
  "manifest.json"
  "manifest.webmanifest"
  "sw.js"
  "robots.txt"
)

is_always_kept() {
  local name="$1"
  for kept in "${ALWAYS_KEEP[@]}"; do
    [[ "$name" == "$kept" ]] && return 0
  done
  return 1
}

# Build one big source blob to grep against (faster than per-file greps)
SOURCE_FILES=()
for dir in "${SEARCH_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' f; do
    SOURCE_FILES+=("$f")
  done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.json" \) -print0)
done

UNUSED=()
USED=()

while IFS= read -r -d '' asset; do
  rel="${asset#$PUBLIC_DIR/}"   # e.g. "doctors/foo.webp" or "arrow.svg"
  base="$(basename "$asset")"  # e.g. "arrow.svg"

  # Always keep system files
  if is_always_kept "$base"; then
    USED+=("$rel (always kept)")
    continue
  fi

  # Search for the basename in all source files
  if grep -qF "$base" "${SOURCE_FILES[@]}" 2>/dev/null; then
    USED+=("$rel")
  else
    UNUSED+=("$rel")
  fi
done < <(find "$PUBLIC_DIR" -type f -print0)

echo ""
echo "========================================"
echo "  PUBLIC ASSET AUDIT"
echo "========================================"
echo ""
echo "USED (${#USED[@]}):"
for f in "${USED[@]}"; do echo "  ✓  $f"; done

echo ""
echo "UNUSED (${#UNUSED[@]}):"
for f in "${UNUSED[@]}"; do echo "  ✗  $f"; done

echo ""

if [[ "$DELETE" == true ]]; then
  if [[ ${#UNUSED[@]} -eq 0 ]]; then
    echo "Nothing to delete."
  else
    echo "Deleting ${#UNUSED[@]} unused files..."
    for f in "${UNUSED[@]}"; do
      rm -f "$PUBLIC_DIR/$f"
      echo "  deleted: $f"
    done
    # Remove empty directories left behind
    find "$PUBLIC_DIR" -type d -empty -delete
    echo ""
    echo "Done. ${#UNUSED[@]} files removed."
  fi
else
  echo "DRY RUN — no files deleted."
  echo "Run with --delete to remove unused files:"
  echo "  bash scripts/clean-public.sh --delete"
fi
