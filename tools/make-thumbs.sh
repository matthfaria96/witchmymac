#!/usr/bin/env bash
# Gera as imagens leves da página inicial a partir dos arquivos originais.
# Rode de novo sempre que uma captura de tela ou ícone mudar:  ./tools/make-thumbs.sh
#
# - assets/thumbs/<app>.webp       miniatura do cartão (640 px de largura) da 1ª captura de cada app
# - assets/icons/<app>.webp        ícone em 128 px (os .png continuam para as páginas dos apps e o OG)
# - assets/icons/logo.webp         logo do topo e do fim da página (440 px)
# - assets/icons/logo-small.webp   logo da barra e do rodapé (80 px)
#
# Precisa do cwebp (brew install webp). Capturas que ainda não existem são puladas com um aviso.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CWEBP="$(command -v cwebp || true)"
[ -z "$CWEBP" ] && [ -x /opt/homebrew/bin/cwebp ] && CWEBP=/opt/homebrew/bin/cwebp
[ -z "$CWEBP" ] && { echo "cwebp não encontrado (brew install webp)" >&2; exit 1; }

THUMB_WIDTH=640
THUMB_QUALITY=70
ICON_SIZE=128

# app → captura usada no cartão (a primeira da prévia, em index.html)
SHOTS=(
  "macdash:assets/shots/macdash/home.jpg"
  "viewtube:assets/shots/viewtube/youtube-watch.jpg"
  "bettercraft:assets/shots/bettercraft/redesign-dark.jpg"
  "hyperimage:assets/shots/hyperimage/main.jpg"
  "hypervideo:assets/shots/hypervideo/main.jpg"
  "neorar:assets/shots/neorar/list.jpg"
  "sirena:assets/shots/sirena/home.jpg"
  "rubbishnotes:assets/shots/rubbishnotes/main-dark.jpg"
  "wineup:assets/shots/wineup/glass-full.jpg"
  "santovideoplayer:assets/shots/santovideoplayer/cabinet-gulliver.jpg"
  "animelocalizationstudio:assets/shots/animelocalizationstudio/editor.jpg"
  "wormlink:assets/shots/wormlink/main.jpg"
  "bunnygrid:assets/shots/bunnygrid/table-dark.jpg"
  "espelho:assets/shots/espelho/home.jpg"
  "winapps:assets/shots/winapps/library-dark.jpg"
)

mkdir -p assets/thumbs

size() { wc -c < "$1" | tr -d ' '; }

echo "Miniaturas (${THUMB_WIDTH} px, q${THUMB_QUALITY}):"
for entry in "${SHOTS[@]}"; do
  key="${entry%%:*}"
  src="${entry#*:}"
  out="assets/thumbs/${key}.webp"
  if [ ! -f "$src" ]; then
    echo "  ! ${key}: ${src} não existe ainda, pulei"
    continue
  fi
  "$CWEBP" -quiet -q "$THUMB_QUALITY" -m 6 -sharp_yuv -metadata none -resize "$THUMB_WIDTH" 0 "$src" -o "$out"
  # Passou de 40 KB? Tenta de novo com qualidade menor.
  if [ "$(size "$out")" -gt 40960 ]; then
    "$CWEBP" -quiet -q 58 -m 6 -sharp_yuv -metadata none -resize "$THUMB_WIDTH" 0 "$src" -o "$out"
  fi
  printf '  %-26s %6d bytes\n' "$key" "$(size "$out")"
done

echo "Ícones (${ICON_SIZE} px):"
for png in assets/icons/*.png; do
  name="$(basename "$png" .png)"
  case "$name" in
    favicon|apple-touch-icon|logo|logo-128) continue ;;
  esac
  out="assets/icons/${name}.webp"
  "$CWEBP" -quiet -q 82 -alpha_q 90 -m 6 -metadata none -resize "$ICON_SIZE" "$ICON_SIZE" "$png" -o "$out"
  printf '  %-26s %6d bytes\n' "$name" "$(size "$out")"
done

echo "Logo:"
"$CWEBP" -quiet -q 82 -alpha_q 90 -m 6 -metadata none -resize 440 440 assets/icons/logo.png -o assets/icons/logo.webp
"$CWEBP" -quiet -q 85 -alpha_q 95 -m 6 -metadata none -resize 80 80 assets/icons/logo-128.png -o assets/icons/logo-small.webp
printf '  %-26s %6d bytes\n' logo "$(size assets/icons/logo.webp)" logo-small "$(size assets/icons/logo-small.webp)"
