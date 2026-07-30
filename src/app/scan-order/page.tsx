import type { Metadata } from "next";
import { ScanOrderContent } from "@/components/ScanOrderContent";

// QR-code-linked ordering flow for someone physically at a Zostel — not
// listed in Header's NAV_LINKS and marked noindex, so it's only reachable
// via a direct link (the printed QR code), never from site nav or search.
export const metadata: Metadata = {
  title: "Scan & Order — Mindcafe",
  robots: { index: false, follow: false },
};

export default function ScanOrderPage() {
  return <ScanOrderContent />;
}
