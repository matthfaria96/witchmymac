#!/bin/bash
# witchmymac installer — installs one of the witchmymac apps from its latest GitHub release.
#
#   curl -fsSL https://witchmymac.com/install.sh | bash -s <app>
#
# What it does: finds the newest release tagged <app>-v<version> on
# github.com/matthfaria96/witchmymac-release (a public repo that only holds the installers; the
# apps' source code is private), downloads the .dmg, checks its SHA-256 against the one GitHub
# publishes, copies the app to /Applications (quitting the running copy first), and opens it.
# Files downloaded with curl don't get macOS's "downloaded from the internet" mark, so the app
# opens without the Gatekeeper prompt.
#
# Testing: WITCH_DEST=<folder> installs somewhere else; WITCH_NO_OPEN=1 doesn't open the app.
set -euo pipefail

OWNER="matthfaria96"
RELEASES_REPO="witchmymac-release"

# The app's key (the prefix of its release tags), accepting a few short aliases.
app_key() {
  case "$1" in
    rubbish-notes) echo "rubbishnotes" ;;
    santo) echo "santovideoplayer" ;;
    als) echo "animelocalizationstudio" ;;
    excalibur) echo "excaliburforms" ;;
    *) case " $APPS " in *" $1 "*) echo "$1" ;; *) return 1 ;; esac ;;
  esac
}

APPS="sirena macdash neorar rubbishnotes bunnygrid wormlink bettercraft santovideoplayer viewtube hypervideo hyperimage wineup animelocalizationstudio espelho excaliburforms winapps aitracker instamac veocode manhwafy garimpalo kaveelsbook"

say() { printf '\033[1;35m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

KEY="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
if [ -z "$KEY" ]; then
  echo "Usage: curl -fsSL https://witchmymac.com/install.sh | bash -s <app>"
  echo "Apps: $APPS"
  exit 1
fi
CANON="$(app_key "$KEY")" || fail "unknown app \"$KEY\". Apps: $APPS"
KEY="$CANON"
[ "$(uname -s)" = "Darwin" ] || fail "these apps are for macOS."

TMP="$(mktemp -d)"
MOUNT="$TMP/mount"
cleanup() {
  if [ -d "$MOUNT" ]; then hdiutil detach "$MOUNT" -quiet -force >/dev/null 2>&1 || true; fi
  rm -rf "$TMP"
}
trap cleanup EXIT

say "Looking for the latest $KEY release…"
# Releases come newest first. The first .dmg whose download URL sits under a "<key>-v…" tag is
# the latest version of this app; GitHub lists the asset's "digest" right before its URL.
URL=""; SHA=""
for PAGE in 1 2 3 4 5; do
  LIST="$(curl -fsSL -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$OWNER/$RELEASES_REPO/releases?per_page=100&page=$PAGE")" \
    || fail "couldn't reach GitHub. Try again in a minute, or download from https://witchmymac.com"
  LINES="$(printf '%s' "$LIST" | tr -d '\r' | grep -E '"(digest|browser_download_url)"' || true)"
  [ -n "$LINES" ] || break
  ASSET="$(printf '%s\n' "$LINES" | grep -m1 -B1 -E "\"browser_download_url\": *\"[^\"]+/download/$KEY-v[^/\"]+/[^\"]+\.dmg\"" || true)"
  if [ -n "$ASSET" ]; then
    URL="$(printf '%s\n' "$ASSET" | tail -1 | sed -nE 's/.*"browser_download_url": *"([^"]+)".*/\1/p')"
    SHA="$(printf '%s\n' "$ASSET" | head -1 | sed -nE 's/.*"digest": *"sha256:([0-9a-f]+)".*/\1/p')"
    break
  fi
done
[ -n "$URL" ] || fail "no .dmg found for $KEY in github.com/$OWNER/$RELEASES_REPO."

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

# Copy the new app out of the .dmg before touching the installed one: if the copy fails
# (the .dmg gets unmounted, disk full…) the old app stays where it was.
STAGE="$TMP/stage"
mkdir -p "$STAGE"
ditto --hfsCompression "$SOURCE" "$STAGE/$NAME" || fail "couldn't copy $NAME out of the .dmg; nothing was changed."
[ -f "$STAGE/$NAME/Contents/Info.plist" ] || fail "the copied $NAME looks incomplete; nothing was changed."

if [ -n "$BUNDLE_ID" ] && [ -z "${WITCH_DEST:-}" ] && pgrep -f "$DEST/$NAME/Contents/" >/dev/null 2>&1; then
  say "Quitting the running ${NAME}…"
  osascript -e "tell application id \"$BUNDLE_ID\" to quit" >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "$DEST/$NAME/Contents/" >/dev/null 2>&1 || break; sleep 0.5; done
fi

say "Installing $NAME to ${DEST}…"
# Some apps keep read-only folders inside the bundle (Instamac's 0555 lib cache): make the old
# copy writable first, or rm stops halfway. --hfsCompression keeps the DMG's APFS compression.
[ -e "$DEST/$NAME" ] && chmod -R u+w "$DEST/$NAME" 2>/dev/null || true
rm -rf "$DEST/$NAME"
mv "$STAGE/$NAME" "$DEST/$NAME" 2>/dev/null || ditto --hfsCompression "$STAGE/$NAME" "$DEST/$NAME" || fail "couldn't put $NAME in $DEST. Download it from https://witchmymac.com instead."
xattr -dr com.apple.quarantine "$DEST/$NAME" 2>/dev/null || true

say "Done: $DEST/$NAME"
if [ -z "${WITCH_NO_OPEN:-}" ]; then open "$DEST/$NAME"; fi
