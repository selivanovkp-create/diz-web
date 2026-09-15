import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: "export" as const,
        basePath: "/diz-web",
        assetPrefix: "/diz-web",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
