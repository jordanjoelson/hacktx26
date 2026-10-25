import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  // The sample recap moved from /postcard to /recap; keep old links working.
  async redirects() {
    return [
      { source: "/postcard", destination: "/recap", permanent: true },
      { source: "/postcard/:path*", destination: "/recap/:path*", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        // CSS Modules must keep Next.js's scoped class-name exports.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
