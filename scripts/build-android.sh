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

# Signed with the shop's own key, not Gradle's throwaway debug one.
#
# Android will only install an update over an existing app when both carry the
# same signature. The debug key is generated per machine, so a rebuild from a
# fresh container produced an apk the tablet refused — the shop would have had
# to uninstall first and lose everything the app had stored, including sales
# taken offline and not yet pushed.
#
# The key lives in the repo on purpose: it is the only place it survives, and
# losing it means never being able to update the installed app again. It
# protects nothing of value on its own — signing a replacement still needs the
# repo and physical access to the tablet.
echo "==> assembling the apk"
( cd android && ./gradlew --no-daemon assembleRelease -q \
    -Pandroid.injected.signing.store.file="$(cd ..; pwd)/android-signing/bcb-release.jks" \
    -Pandroid.injected.signing.store.password=bcbpos2026 \
    -Pandroid.injected.signing.key.alias=bcb \
    -Pandroid.injected.signing.key.password=bcbpos2026 )

APK="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK" ]; then echo "ERROR: no apk produced" >&2; exit 1; fi

mkdir -p desktop-build/dist
cp "$APK" desktop-build/dist/BCB-POS.apk
echo
echo "==> done: desktop-build/dist/BCB-POS.apk  ($(du -h desktop-build/dist/BCB-POS.apk | cut -f1))"
