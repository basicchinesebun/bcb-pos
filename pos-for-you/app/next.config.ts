import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: '/pos-for-you',
  assetPrefix: '/pos-for-you',
};

export default nextConfig;
