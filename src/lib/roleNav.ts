// Single source of truth for "where does this role's own dashboard live" —
// used by both the desktop ProfileMenu dropdown and the mobile Header menu
// so a signed-in expert/employer/admin always has a real link to their own
// area instead of having to know/guess the URL. This is a discoverability
// aid only, not the security boundary: /expert/dashboard, /employer/
// dashboard, and /admin each independently redirect away anyone whose
// profile.role doesn't match, regardless of whether they got there via
// this link or a typed URL — see each page's own role check.
export type DashboardLink = { href: string; label: string };

export function getDashboardLink(role: string | null | undefined): DashboardLink | null {
  switch (role) {
    case "expert":
      return { href: "/expert/dashboard", label: "expert dashboard" };
    case "employer":
      return { href: "/employer/dashboard", label: "employer dashboard" };
    case "admin":
    case "super_admin":
      return { href: "/admin", label: "admin panel" };
    default:
      return null;
  }
}
