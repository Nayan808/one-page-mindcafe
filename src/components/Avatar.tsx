function initials(label: string): string {
  return label.trim().slice(0, 1).toUpperCase() || "?";
}

// Shared avatar rendering — profile photo if the account has one,
// otherwise the first letter of the name/email on an ink circle. Used by
// both the desktop ProfileMenu and the mobile toggle's account row so the
// two never drift out of sync.
export function Avatar({
  label,
  avatarUrl,
  className = "h-9 w-9 text-xs",
}: {
  label: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-ink font-semibold text-cream ${className}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(label)
      )}
    </span>
  );
}
