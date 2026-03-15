#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/out"

echo "Alkemical Development — Image Optimization"
echo

# SVG optimization via svgo
if command -v svgo &>/dev/null; then
  echo "Optimizing SVGs..."
  find "$OUT/logo/svg" -name '*.svg' -exec svgo --multipass {} \; 2>/dev/null || true
  echo "  ✓ SVGs optimized"
else
  echo "  ⚠ svgo not found — skipping SVG optimization"
  echo "    Install: npm install -g svgo"
fi

echo

# PNG → WebP conversion via sharp-cli or cwebp
mkdir -p "$OUT/logo/webp"

if command -v sharp &>/dev/null; then
  echo "Converting PNGs to WebP..."
  for png in "$OUT"/logo/png/*.png; do
    [ -f "$png" ] || continue
    base=$(basename "$png" .png)
    sharp -i "$png" -o "$OUT/logo/webp/${base}.webp" -- webp
    echo "  ✓ $base.webp"
  done
elif command -v cwebp &>/dev/null; then
  echo "Converting PNGs to WebP (via cwebp)..."
  for png in "$OUT"/logo/png/*.png; do
    [ -f "$png" ] || continue
    base=$(basename "$png" .png)
    cwebp -q 90 "$png" -o "$OUT/logo/webp/${base}.webp"
    echo "  ✓ $base.webp"
  done
else
  echo "  ⚠ Neither sharp-cli nor cwebp found — skipping WebP conversion"
  echo "    Install: npm install -g sharp-cli  OR  brew install webp"
fi

echo
echo "Done."
