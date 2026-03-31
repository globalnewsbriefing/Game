import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const repoName = "Game";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStaticExport ? "export" : "standalone",
  basePath: isStaticExport ? `/${repoName}` : undefined,
  assetPrefix: isStaticExport ? `/${repoName}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
