import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // mindcafe.app: expert photos hotlinked from the existing live site
    // (same company) until real photo assets are hosted here directly.
    remotePatterns: [{ protocol: "https", hostname: "mindcafe.app" }],
  },
};

export default nextConfig;
