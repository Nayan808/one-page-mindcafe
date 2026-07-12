import { AccordionFaq } from "@/components/AccordionFaq";

const FAQS = [
  {
    question: "Is everything I say confidential?",
    answer:
      "Yes — sessions are private between you and your counsellor. The only exceptions are the standard safety exceptions any licensed professional follows (like risk of harm to yourself or others), which your counsellor will always explain upfront.",
  },
  {
    question: "How do I pick the right category?",
    answer:
      "If you're not sure, individual therapy is a solid starting point for most concerns — your counsellor can point you toward a more specific category if needed. Family/relationship and child & adolescent are for when someone else is directly involved in the sessions.",
  },
  {
    question: "What happens in a first session?",
    answer:
      "Mostly getting to know each other — what's bringing you in, what you're hoping for, and how your counsellor typically works. There's no pressure to have it all figured out before you start.",
  },
  {
    question: "Can I switch counsellors later?",
    answer:
      "Yes. Fit matters more than sticking it out — if a counsellor isn't the right match, you can switch without it being awkward.",
  },
];

export function CounsellingFaqSection() {
  return <AccordionFaq id="counselling-faq" heading="faq" items={FAQS} />;
}
