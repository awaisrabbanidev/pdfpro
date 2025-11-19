import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@pdftron/pdfnet-node"],
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
