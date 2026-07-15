import { BrandLoaderScreen } from "@/components/BrandLoader";

// Next.js route-level loading boundary — shown automatically during
// navigation/data fetching for any route that doesn't define its own
// loading.tsx.
export default function Loading() {
  return <BrandLoaderScreen />;
}
