// The desktop build is the same app exported as plain files, so it can be
// installed on the shop's Windows till and opened with no internet at all —
// not even the first time. It is driven by an env var rather than a second
// config file so there is only ever one source of truth for the rest.
//
// Two things have to change for it: the output has to be static files, and
// the redirect has to go, because a static export has no server to redirect
// with. The API routes are moved aside by scripts/build-desktop.sh for the
// same reason — they are online-only features (slip checking, image upload)
// and the desktop build points them at the live site instead.
const isDesktop = process.env.DESKTOP_BUILD === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  ...(isDesktop
    ? { output: 'export', distDir: '.next-desktop', trailingSlash: true }
    : {
        async redirects() {
          return [
            {
              source: '/',
              destination: '/order',
              permanent: false,
            },
          ]
        },
      }),
}

module.exports = nextConfig
