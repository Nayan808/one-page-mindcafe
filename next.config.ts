import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // mindcafe.app: legacy — photos hotlinked from the existing live
      // site before the expert-photos storage bucket existed. Some rows
      // may still reference it even though the known-dead ones were
      // cleared; kept allowed rather than assuming nothing points here.
      { protocol: "https", hostname: "mindcafe.app" },
      // Supabase Storage — expert photos uploaded directly from
      // /admin/experts (see setup.sql's expert-photos bucket). Exact
      // project hostname, not a wildcard — this app only ever talks to
      // one Supabase project (NEXT_PUBLIC_SUPABASE_URL).
      { protocol: "https", hostname: "tqjpzqozysmdsuujzvmy.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
