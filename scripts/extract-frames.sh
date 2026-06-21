#!/usr/bin/env bash
# Régénère les frames de l'Intro depuis la vidéo source.
# Sortie : public/intro/frames/f_0001.webp ... (2560px de large, WebP q82).
# Voir docs/adr/0002-frames-canvas-vs-video.md pour le pourquoi.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="portfolio_intro.mp4"
OUT="public/intro/frames"

rm -rf "$OUT"
mkdir -p "$OUT"

ffmpeg -loglevel error -y -i "$SRC" \
  -vf "scale=2560:-2" \
  -c:v libwebp -quality 82 -preset picture \
  "$OUT/f_%04d.webp"

echo "Frames générées : $(ls "$OUT" | wc -l) dans $OUT"
