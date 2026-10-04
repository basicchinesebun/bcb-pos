#!/usr/bin/env bash
# Build the Android app: an .apk to copy onto the shop's tablet.
#
# Same code as the Windows build and the website — the export from
# build-desktop.sh, settings and a reserved block of queue numbers baked in,
# so a tablet that has never been online can still open and sell.
#
# The root page is replaced with a chooser. The Windows build goes straight to
# the till because that machine is the till; a tablet is whatever it is put
# down next to, and the exported root sends a browser to the customer ordering
# screen, which is not what any of these screens want.
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

if [ ! -d "$ANDROID_HOME/platforms" ]; then
  echo "ERROR: no Android SDK at $ANDROID_HOME" >&2
  exit 1
fi

echo "==> exporting the site"
./scripts/build-desktop.sh > /dev/null
cp scripts/android-launcher.html out-desktop/index.html

echo "==> syncing into the Android project"
npx cap sync android

echo "==> assembling the apk"
( cd android && ./gradlew --no-daemon assembleDebug -q )

APK="android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK" ]; then echo "ERROR: no apk produced" >&2; exit 1; fi

mkdir -p desktop-build/dist
cp "$APK" desktop-build/dist/BCB-POS.apk
echo
echo "==> done: desktop-build/dist/BCB-POS.apk  ($(du -h desktop-build/dist/BCB-POS.apk | cut -f1))"
