import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for server-side deployment (needed for API routes)
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Enable server-side features for API routes
  experimental: {
    // Remove invalid experimental config
  }
};

export default nextConfig;
