import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-compatible configuration
  trailingSlash: false, // Remove trailing slash for Vercel
  images: {
    unoptimized: true
  },
  // Vercel handles server-side features automatically
  output: undefined, // Let Vercel handle output
  // Remove conflicting settings
  experimental: {
    // No experimental features for Vercel compatibility
  }
};

export default nextConfig;
