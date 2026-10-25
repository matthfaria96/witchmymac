#!/bin/bash
# witchmymac installer — installs one of the witchmymac apps from its latest GitHub release.
#
#   curl -fsSL https://witchmymac.com/install.sh | bash -s <app>
#
# What it does: finds the latest release on github.com/matthfaria96/<repo>, downloads the .dmg,
# checks its SHA-256 against the one GitHub publishes, copies the app to /Applications (quitting
# the running copy first), and opens it. Files downloaded with curl don't get macOS's
# "downloaded from the internet" mark, so the app opens without the Gatekeeper prompt.
#
# Testing: WITCH_DEST=<folder> installs somewhere else; WITCH_NO_OPEN=1 doesn't open the app.
set -euo pipefail

OWNER="matthfaria96"

repo_for() {
  case "$1" in
    sirena) echo "Sirena" ;;
    macdash) echo "MacDash" ;;
    neorar) echo "Neorar" ;;
    rubbishnotes|rubbish-notes) echo "rubbish-notes" ;;
    bunnygrid) echo "BunnyGrid" ;;
    wormlink) echo "Wormlink" ;;
    bettercraft) echo "bettercraft-launcher" ;;
    santovideoplayer|santo) echo "santo-video-player" ;;
    viewtube) echo "viewtube-mac" ;;
    hypervideo) echo "hypervideo-converter" ;;
    hyperimage) echo "hyperimage-converter" ;;
    wineup) echo "wineup-player" ;;
    *) return 1 ;;
  esac
}

APPS="sirena macdash neorar rubbishnotes bunnygrid wormlink bettercraft santovideoplayer viewtube hypervideo hyperimage wineup"

say() { printf '\033[1;35m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

KEY="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
if [ -z "$KEY" ]; then
  echo "Usage: curl -fsSL https://witchmymac.com/install.sh | bash -s <app>"
  echo "Apps: $APPS"
  exit 1
fi
REPO="$(repo_for "$KEY")" || fail "unknown app \"$KEY\". Apps: $APPS"
[ "$(uname -s)" = "Darwin" ] || fail "these apps are for macOS."

TMP="$(mktemp -d)"
MOUNT="$TMP/mount"
cleanup() {
  if [ -d "$MOUNT" ]; then hdiutil detach "$MOUNT" -quiet -force >/dev/null 2>&1 || true; fi
  rm -rf "$TMP"
}
trap cleanup EXIT

say "Looking for the latest $REPO release…"
RELEASE="$(curl -fsSL -H 'Accept: application/vnd.github+json' "https://api.github.com/repos/$OWNER/$REPO/releases/latest")" \
  || fail "couldn't reach GitHub. Try again in a minute, or download from https://witchmymac.com"
# The first .dmg asset and its digest (GitHub lists "digest" right before "browser_download_url").
ASSET="$(printf '%s' "$RELEASE" | tr -d '\r' | grep -E '"(digest|browser_download_url)"' | grep -B1 -E '"browser_download_url": *"[^"]+\.dmg"' | head -2)"
URL="$(printf '%s' "$ASSET" | sed -nE 's/.*"browser_download_url": *"([^"]+)".*/\1/p')"
SHA="$(printf '%s' "$ASSET" | sed -nE 's/.*"digest": *"sha256:([0-9a-f]+)".*/\1/p')"
[ -n "$URL" ] || fail "no .dmg found in the latest release of $REPO."

say "Downloading $(basename "$URL") …"
curl -fL --progress-bar -o "$TMP/app.dmg" "$URL" || fail "download failed."
if [ -n "$SHA" ]; then
  GOT="$(shasum -a 256 "$TMP/app.dmg" | awk '{print $1}')"
  [ "$GOT" = "$SHA" ] || fail "checksum mismatch (expected $SHA, got $GOT). Nothing was installed."
  say "Checksum OK (SHA-256)."
else
  say "GitHub didn't publish a checksum for this file; skipping the check."
fi

mkdir -p "$MOUNT"
hdiutil attach "$TMP/app.dmg" -nobrowse -readonly -noautoopen -mountpoint "$MOUNT" -quiet || fail "couldn't open the .dmg."
SOURCE="$(find "$MOUNT" -maxdepth 1 -name '*.app' -print -quit)"
[ -n "$SOURCE" ] || fail "no app inside the .dmg."
NAME="$(basename "$SOURCE")"
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$SOURCE/Contents/Info.plist" 2>/dev/null || true)"

DEST="${WITCH_DEST:-/Applications}"
if [ -z "${WITCH_DEST:-}" ] && [ ! -w "$DEST" ]; then
  DEST="$HOME/Applications"
  say "/Applications isn't writable for this user; installing to ~/Applications instead."
fi
mkdir -p "$DEST"

if [ -n "$BUNDLE_ID" ] && [ -z "${WITCH_DEST:-}" ] && pgrep -f "$DEST/$NAME/Contents/MacOS/" >/dev/null 2>&1; then
  say "Quitting the running ${NAME}…"
  osascript -e "tell application id \"$BUNDLE_ID\" to quit" >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "$DEST/$NAME/Contents/MacOS/" >/dev/null 2>&1 || break; sleep 0.5; done
fi

say "Installing $NAME to ${DEST}…"
rm -rf "$DEST/$NAME"
ditto "$SOURCE" "$DEST/$NAME"
xattr -dr com.apple.quarantine "$DEST/$NAME" 2>/dev/null || true

say "Done: $DEST/$NAME"
if [ -z "${WITCH_NO_OPEN:-}" ]; then open "$DEST/$NAME"; fi
