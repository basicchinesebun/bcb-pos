#!/usr/bin/env bash
# Publish a new build of the shop's own code for installed tills to pick up.
#
# This is the five megabytes, not the three hundred and seventy. It goes into
# public/, so the ordinary Vercel deploy serves it and there is nothing extra
# to host; an installed till checks desktop/manifest.json and fetches
# desktop/site.tar.gz when the build id has moved.
#
# After running this: commit and push. The till sees it once the deploy lands.
set -euo pipefail
cd "$(dirname "$0")/.."

BUILD="${1:-$(date -u +%Y%m%d-%H%M)}"
DEST="public/desktop"

echo "==> building the site"
./scripts/build-desktop.sh > /dev/null

# Stamp the build id into the seed so an installed till can say which code it
# is running, and so the updater has something to compare against.
node -e "
const fs=require('fs');
const p='out-desktop/offline-seed.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
s.build=process.argv[1];
fs.writeFileSync(p, JSON.stringify(s));
console.log('stamped build', s.build);
" "$BUILD"

mkdir -p "$DEST"
echo "==> packing"
# -C so paths inside are relative to the site root: the updater extracts
# straight into a directory and expects staff/index.html at the top.
tar -czf "$DEST/site.tar.gz" -C out-desktop .

SIZE=$(stat -c%s "$DEST/site.tar.gz")
cat > "$DEST/manifest.json" <<JSON
{
  "build": "$BUILD",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bytes": $SIZE
}
JSON

echo
echo "==> build $BUILD — $(numfmt --to=iec "$SIZE" 2>/dev/null || echo "$SIZE bytes")"
echo "    $DEST/site.tar.gz"
echo "    $DEST/manifest.json"
echo
echo "now: git add public/desktop && git commit && git push"
