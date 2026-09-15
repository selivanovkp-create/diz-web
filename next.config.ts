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
    : {
        // Telegram Mini App WebViews cache aggressively — keep HTML fresh.
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Cache-Control", value: "no-store, must-revalidate" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
