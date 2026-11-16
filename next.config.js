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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/order',
        permanent: false,
      },
    ]
  },
  // The 玉灵膏 shop is its own Vercel project (beautishop). Serve it under
  // /beautishop on this domain by proxying there; it keeps its own data
  // (Vercel Blob) and never touches this app's Supabase.
  async rewrites() {
    return [
      { source: '/beautishop', destination: 'https://beautishop-kohl.vercel.app/beautishop' },
      { source: '/beautishop/:path*', destination: 'https://beautishop-kohl.vercel.app/beautishop/:path*' },
    ]
  },
}

module.exports = nextConfig
