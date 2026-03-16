#!/bin/bash
# Watches for .tsx/.ts file changes under src/ and touches tailwind.css
# to trigger a Tailwind CSS rebuild via vite build --watch.
#
# This is needed because vite build --watch (Rollup) doesn't re-process
# tailwind.css when only .tsx files change — Tailwind needs to re-scan
# for new tw: classes.
#
# Excludes the styles/ directory to avoid infinite loops (touching
# tailwind.css would otherwise re-trigger the watcher).

cd "$(dirname "$0")/.." || exit 1

echo "[tw-watch] Watching src/ for .tsx/.ts changes..."

while inotifywait -r -e modify --exclude 'styles/' src/; do
  echo "[tw-watch] Change detected, touching tailwind.css"
  touch src/styles/tailwind.css
done
