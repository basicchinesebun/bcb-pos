#!/usr/bin/env bash
# Export the app as plain files for the Windows desktop build.
#
# A static export cannot contain route handlers, and the six under src/app/api
# are all online-only anyway — uploading images, checking payment slips, the
# Facebook webhook. The desktop app points those at the live site, so here they
# are simply moved out of the tree for the duration of the build.
#
# The trap matters: a build that fails partway would otherwise leave the API
# routes outside src/, and the next ordinary `npm run build` would quietly ship
# a site with no upload endpoint.
set -euo pipefail

cd "$(dirname "$0")/.."

API_SRC="src/app/api"
API_PARK=".api-parked"

restore() {
  if [ -d "$API_PARK" ]; then
    rm -rf "$API_SRC"
    mv "$API_PARK" "$API_SRC"
    echo "restored $API_SRC"
  fi
}
trap restore EXIT INT TERM

if [ -d "$API_SRC" ]; then
  rm -rf "$API_PARK"
  mv "$API_SRC" "$API_PARK"
  echo "parked $API_SRC"
fi

rm -rf .next-desktop out-desktop
DESKTOP_BUILD=1 npx next build

# Next 16 writes the exported files straight into distDir — not into
# <distDir>/out as older versions did, and not into ./out.
if [ -f ".next-desktop/staff/index.html" ]; then
  mv .next-desktop out-desktop
elif [ -d ".next-desktop/out" ]; then
  mv .next-desktop/out out-desktop
elif [ -f "out/staff/index.html" ]; then
  mv out out-desktop
else
  echo "ERROR: no exported output found (looked for staff/index.html)" >&2
  exit 1
fi

echo
echo "exported to out-desktop/"
ls out-desktop | head -20
