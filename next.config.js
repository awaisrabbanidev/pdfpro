/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@pdftron/pdfnet-node"],
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
