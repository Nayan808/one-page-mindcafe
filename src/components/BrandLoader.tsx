import Image from "next/image";

// Branded loading spinner — just the mindcafe mark (no wordmark), cropped
// from public/mindcafe-logo.png, spinning continuously. Reusable anywhere
// a generic "Loading…" text currently stands in.
export function BrandLoader({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/mindcafe-icon.png"
      alt="Loading"
      width={size}
      height={size}
      priority
      className="animate-spin"
      style={{ animationDuration: "1.1s" }}
    />
  );
}

// Full-viewport centered variant, for page-level loading states
// (Next.js loading.tsx boundaries, full-screen auth/data gates).
export function BrandLoaderScreen() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <BrandLoader size={48} />
    </div>
  );
}
