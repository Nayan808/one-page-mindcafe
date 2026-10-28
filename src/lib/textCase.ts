// House style for display text: normal Title Case for headings and labels,
// except the brand, which is always written "mindcafe" in lowercase.
// Used where text arrives lowercase from the database or from a caller
// (admin page titles, modal titles, milestone titles), so it renders the
// same way no matter how it was typed.

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "the", "to", "via", "vs", "with"]);

// Words whose casing is fixed regardless of position.
const FIXED: Record<string, string> = {
  mindcafe: "mindcafe",
  feelz: "Feelz",
  zostel: "Zostel",
  ikca: "IKCA",
  eap: "EAP",
  faq: "FAQ",
  faqs: "FAQs",
  csv: "CSV",
  qr: "QR",
  otp: "OTP",
  upi: "UPI",
  id: "ID",
  ids: "IDs",
  awb: "AWB",
  url: "URL",
  hr: "HR",
  "1:1": "1:1",
};

function caseWord(word: string, isFirst: boolean): string {
  // Keep punctuation around the word (quotes, brackets, trailing colon...).
  const match = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9:'’.-]*?)([^A-Za-z0-9]*)$/);
  if (!match) return word;
  const [, lead, core, trail] = match;
  const lower = core.toLowerCase();
  if (FIXED[lower]) return lead + FIXED[lower] + trail;
  // Leave anything that is already deliberately mixed/upper case alone (e.g. "MC-000012", "L-Theanine").
  if (core !== lower) return word;
  if (!isFirst && SMALL_WORDS.has(lower)) return word;
  return lead + core.charAt(0).toUpperCase() + core.slice(1) + trail;
}

/** "contact messages" -> "Contact Messages"; "mindcafe founded" -> "mindcafe Founded". */
export function titleCase(text: string): string {
  return text
    .split(/(\s+|—|–)/)
    .map((part, index) => (/^\s+$|^—$|^–$/.test(part) ? part : caseWord(part, index === 0)))
    .join("");
}

/** Brand rule only: any "Mindcafe"/"MINDCAFE" in free text becomes "mindcafe". */
export function brandCase(text: string): string {
  return text.replace(/\bmindcafe\b/gi, "mindcafe");
}
