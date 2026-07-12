import { AccordionFaq } from "@/components/AccordionFaq";

const FAQS = [
  {
    question: "How do I take a feelz strip?",
    answer:
      "Open the pack, place the strip on your tongue, and let it dissolve naturally — no water needed. It melts within seconds, so you can use it anywhere.",
  },
  {
    question: "How quickly does feelz work?",
    answer:
      "Since the strip dissolves in your mouth, the ingredients absorb through the oral mucosa — faster than a traditional tablet. Effectiveness varies by individual factors like body weight; feelz is a supportive wellness tool, not an instant fix.",
  },
  {
    question: "When should I use each mood?",
    answer:
      "focus sharpens mental clarity for work or study. joy eases stress and low mood. extrovert supports confidence before social situations. rest helps you wind down before bed.",
  },
  {
    question: "Will feelz make me feel sleepy or drowsy?",
    answer:
      "Only rest is formulated to promote relaxation for bedtime. focus, joy, and extrovert support clarity and balance without drowsiness, so they're fine for daytime use.",
  },
];

export function FaqSection() {
  return <AccordionFaq id="faq" heading="faq" items={FAQS} />;
}
