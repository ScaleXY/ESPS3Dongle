#!/bin/sh
# Build (no routing) and render placement-review PNGs into dist/review/
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
tsci build index.circuit.tsx --disable-parts-engine --routing-disabled --ignore-warnings 2>&1 \
  | grep -v -E "^Via hole at .* overlaps SMD pad U1.EP" | grep -E "overlap|close|outside|rror|extends" || true
mkdir -p dist/review
NP="$(dirname "$(readlink -f "$(command -v tsci)")")/node_modules"
python3 scripts/placement_view.py dist/index/circuit.json dist/review/full.svg
python3 scripts/placement_view.py dist/index/circuit.json dist/review/left.svg 6 22 -7 7
python3 scripts/placement_view.py dist/index/circuit.json dist/review/mid.svg 15 32 -7 7
python3 scripts/placement_view.py dist/index/circuit.json dist/review/right.svg 27 50 -7 7
for f in full left mid right; do NODE_PATH="$NP" bun scripts/svg2png.ts dist/review/$f.svg dist/review/$f.png; done
