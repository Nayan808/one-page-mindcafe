// Plain constants shared by both server code (generateStaticParams) and
// client components — deliberately NOT in a "use client" file, since
// Next.js replaces a client module's exports with a client-reference stub
// when imported from server-only code, which breaks plain-value exports
// like this array.
export const VALID_CATEGORY_SLUGS = ["individual", "child-adolescent", "family-relationship", "specialized"] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  individual: "individual",
  "child-adolescent": "child & adolescent",
  "family-relationship": "family & relationship",
  specialized: "specialized",
};
