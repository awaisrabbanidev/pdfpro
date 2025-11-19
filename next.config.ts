import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@pdftron/pdfnet-node"],
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
