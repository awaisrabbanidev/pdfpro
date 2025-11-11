import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  experimental: {
    missingSuspenseWithCSRBailout: false
  }
};

export default nextConfig;
