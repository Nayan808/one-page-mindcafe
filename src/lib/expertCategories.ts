// A role reads as "Professional Support" (structured, credentialed) vs
// "Wellness Guides" (spiritual/lifestyle) by its own certification text —
// there's no separate admin field for this split, so it's inferred from
// the same role string already shown on every expert card, rather than
// adding a new column just for this grouping. Shared between the
// homepage counselling teaser and the /counselling page's own experts
// section so the same expert always lands in the same group everywhere.
// yoga/trainer/practitioner/ayurveda added so roles like "Celebrity Yoga
// Trainer" and "Ayurveda and Hijama Practitioner" land here too, not in
// Professional Support.
export function isWellbeingGuideRole(role: string | undefined | null): boolean {
  return /spiritual|wellbeing|lifestyle|guide|coach|influencer|yoga|trainer|practitioner|ayurveda/i.test(role ?? "");
}
