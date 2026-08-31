"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Expert } from "@/types/domain";
import { formatInr } from "@/lib/utils";

export function ExpertCard({
  expert,
  bookHref,
  showViewDetails = true,
  sessionPrice,
}: {
  expert: Pick<Expert, "id" | "name" | "photo_url" | "bio" | "specialties" | "rating" | "certifications" | "years_experience"> &
    Partial<Pick<Expert, "is_bookable">>;
  /** When set, also renders a "book with {name}" link (subject to
   * is_bookable) — omit on pages where selecting the card itself already
   * is the booking action, like the booking form's own expert-picker step. */
  bookHref?: string;
  /** "view details" links to /experts/[id] — on by default so every card
   * gets it, independent of bookHref. The card may sit inside its own
   * click handler (a selection toggle) elsewhere, so this link stops
   * propagation to avoid also toggling selection underneath the navigation. */
  showViewDetails?: boolean;
  /** Per-session price to show on the card — there's no per-expert price
   * field in the schema, only the single site-wide
   * site_settings.counselling_session_price every expert actually charges,
   * so this is passed in by whichever page already fetched that setting
   * rather than faked per expert. Omitted entirely where a caller doesn't
   * pass it, so this stays opt-in per page. */
  sessionPrice?: number;
}) {
  // A dead/unreachable photo_url (typo'd in the admin form, or hosted
  // somewhere that later 404s) used to render as a broken-image icon with
  // the alt text spilling out of the circle — this falls back to the
  // same initials treatment a missing photo_url already gets, instead of
  // leaving a visibly broken card live on the site.
  const [imageFailed, setImageFailed] = useState(false);

  const initials = expert.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex w-full flex-col items-center rounded-2xl border border-ink bg-white p-6 text-center shadow-lg">
      {expert.photo_url && !imageFailed ? (
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-ink">
          <Image src={expert.photo_url} alt={expert.name} fill className="object-cover" onError={() => setImageFailed(true)} />
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

      {expert.years_experience && <p className="mt-1.5 text-xs text-ink/60">{expert.years_experience} experience</p>}

      {expert.specialties.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {expert.specialties.slice(0, 3).map((specialty) => (
            <span key={specialty} className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] text-ink/60">
              {specialty}
            </span>
          ))}
        </div>
      )}

      {sessionPrice != null && (
        <p className="mt-2 text-sm font-semibold text-ink">
          {formatInr(sessionPrice)} <span className="font-normal text-ink/50">/ session</span>
        </p>
      )}

      {/* Full bio and everything else beyond the above lives on the
          /experts/[id] detail page ("view profile" below), so the card
          itself stays a quick glance, not a mini profile. */}

      {(showViewDetails || bookHref) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {showViewDetails && (
            <Link
              href={`/experts/${expert.id}`}
              onClick={(event) => event.stopPropagation()}
              className="pill-btn-outline !py-2 text-xs"
            >
              View Profile
            </Link>
          )}
          {bookHref && expert.is_bookable !== false && (
            <Link href={bookHref} onClick={(event) => event.stopPropagation()} className="pill-btn !py-2 text-xs">
              Book a Session
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
