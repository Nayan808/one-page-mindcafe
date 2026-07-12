"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// EAP usage analytics (spec 4.18) needs an employer/organization concept
// and a way to link employees to it — neither exists in the schema yet
// (profiles.role='employer' has no supporting tables). Rather than show
// fabricated charts, this is an honest placeholder gated on the real role
// check, ready to fill in once that data model exists.
export default function EmployerDashboardPage() {
  const { status, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/employer/login");
    else if (status === "authenticated" && profile && profile.role !== "employer") router.replace("/employer/login");
  }, [status, profile, router]);

  if (status !== "authenticated" || profile?.role !== "employer") {
    return <div className="px-4 py-16 text-center text-sm text-ink/60">Loading…</div>;
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <BarChart3 className="h-8 w-8 text-ink/30" aria-hidden />
      <h1 className="font-display mt-4 text-2xl font-bold lowercase text-ink">usage analytics — coming soon</h1>
      <p className="mt-2 text-sm text-ink/60">
        Session counts, engagement, and program ROI for your team will show up here once your EAP program is fully set
        up. Reach out to your mindcafé contact for a manual usage report in the meantime.
      </p>
    </div>
  );
}
