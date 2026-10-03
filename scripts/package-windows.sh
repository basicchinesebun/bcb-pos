#!/usr/bin/env bash
# Build the Windows program: a folder with BCB-POS.exe in it, ready to copy to
# the shop's till on a USB stick.
#
# Packaged from Linux without wine. @electron/packager only downloads the
# Windows Electron binaries and copies our files beside them, so no Windows
# toolchain is needed here. (An .msi or a signed installer would need one —
# this produces a portable folder instead, which is what gets carried on a
# stick anyway.)
set -euo pipefail
cd "$(dirname "$0")/.."

STAGE="desktop-build/app"
OUT="desktop-build/dist"

echo "==> exporting the site"
./scripts/build-desktop.sh > /dev/null

echo "==> staging"
rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"
cp -r electron "$STAGE/electron"
cp -r out-desktop "$STAGE/site"

# A package.json of its own, with no dependencies at all: everything the app
# needs is either in Electron or in the site folder. Shipping the project's
# package.json would drag node_modules into the build for nothing.
VERSION=$(node -p "require('./package.json').version")
cat > "$STAGE/package.json" <<JSON
{
  "name": "bcb-pos",
  "productName": "BCB POS",
  "version": "$VERSION",
  "main": "electron/main.js",
  "private": true
}
JSON

echo "==> packaging for Windows x64"
npx @electron/packager "$STAGE" "BCB-POS" \
  --platform=win32 --arch=x64 \
  --out="$OUT" \
  --overwrite \
  --app-version="$VERSION" \
  --win32metadata.CompanyName="Basic Chinese Bun" \
  --win32metadata.FileDescription="BCB POS"

echo
echo "==> done"
du -sh "$OUT"/*
ls "$OUT"/*/ | head
