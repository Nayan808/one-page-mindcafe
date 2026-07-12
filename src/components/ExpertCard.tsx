import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/therapyCategories";
import type { Expert } from "@/types/domain";

export function ExpertCard({
  expert,
  bookHref,
}: {
  expert: Pick<Expert, "name" | "photo_url" | "bio" | "specialties" | "rating" | "certifications">;
  /** When set, renders a "book with {name}" link — omit when the card is
   * itself a selection control (e.g. inside the booking form). */
  bookHref?: string;
}) {
  const initials = expert.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center rounded-2xl border border-ink bg-white p-6 text-center shadow-lg">
      {expert.photo_url ? (
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-ink">
          <Image src={expert.photo_url} alt={expert.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-ink text-lg font-bold text-cream">
          {initials}
        </div>
      )}

      <h3 className="font-display mt-4 text-lg font-bold text-ink">{expert.name}</h3>
      {expert.certifications.length > 0 && (
        <p className="mt-0.5 text-xs font-medium uppercase tracking-label text-ink/50">
          {expert.certifications.join(" · ")}
        </p>
      )}

      {expert.rating !== null && (
        <div className="mt-1 flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5" fill={index < Math.round(expert.rating!) ? "currentColor" : "none"} aria-hidden />
          ))}
        </div>
      )}

      {expert.bio && <p className="mt-3 text-sm leading-relaxed text-ink/60">{expert.bio}</p>}

      {expert.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {expert.specialties.map((specialty) => (
            <span key={specialty} className="rounded-full border border-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-label">
              {CATEGORY_LABELS[specialty] ?? specialty}
            </span>
          ))}
        </div>
      )}

      {bookHref && (
        <Link href={bookHref} className="pill-btn-outline mt-4 !py-2 text-xs">
          book with {expert.name.split(" ")[0]}
        </Link>
      )}
    </div>
  );
}
