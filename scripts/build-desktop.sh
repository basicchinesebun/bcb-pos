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

# Which database this build talks to. It has to be settled before `next build`
# runs, not after: NEXT_PUBLIC_* is compiled into the bundle, so a build that
# picked its env afterwards shipped an app pointing at the real shop with a
# seed taken from the practice one. The installed till then opened on live
# orders while every lease call failed, because the practice functions do not
# exist there.
#
# The practice shop is the default on purpose, for the seed as much as the
# build: seeding reserves real queue numbers on whatever it is pointed at, and
# an installer built by accident must not burn five hundred of the real shop's.
# Building one for the real shop is deliberate:
#   SEED_ENV=live ./scripts/build-desktop.sh
SEED_ENV="${SEED_ENV:-test}"
if [ "$SEED_ENV" = "live" ]; then
  SEED_FILE=".env.local"
else
  SEED_FILE=".env.test-shop"
fi
if [ ! -f "$SEED_FILE" ]; then
  echo "ERROR: $SEED_FILE not found — cannot tell which database to build against" >&2
  exit 1
fi
set -a
. "./$SEED_FILE"
set +a
echo "==> building against $SEED_FILE ($SEED_ENV)"
echo "    $NEXT_PUBLIC_SUPABASE_URL"

rm -rf .next-desktop out-desktop
# .env.local would otherwise win over the exported variables and quietly put the
# real shop back into the bundle.
DESKTOP_BUILD=1 \
  NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  npx next build

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

# The update bundle lives under public/, so it is copied into every export.
# Left there, each release would carry the previous release inside it and the
# download would double in size every time.
rm -rf out-desktop/desktop

# Prove it. The database the bundle talks to is compiled in and invisible
# afterwards, and getting it wrong means an installer that runs the shop's real
# till from a practice seed, or practice staff writing into the real orders.
# Both have already happened once.
EXPECT_HOST=$(printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | sed 's#https\?://##; s#/.*##')
if ! grep -rqs "$EXPECT_HOST" out-desktop/_next; then
  echo "ERROR: the built bundle does not point at $EXPECT_HOST" >&2
  echo "       (.env.local may have won over the environment)" >&2
  exit 1
fi
OTHER=$([ "$SEED_ENV" = "live" ] && echo wwmoqgkkarenzcozmioe || echo jbscoolodkknpweufuwl)
if grep -rqs "$OTHER" out-desktop/_next; then
  echo "ERROR: the built bundle also mentions the other database ($OTHER)" >&2
  exit 1
fi
echo "==> bundle verified against $EXPECT_HOST"

echo "==> seeding from $SEED_FILE"
node scripts/make-seed.mjs out-desktop/offline-seed.json

echo
echo "exported to out-desktop/"
ls out-desktop | head -20
