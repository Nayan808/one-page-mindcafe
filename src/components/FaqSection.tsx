import { AccordionFaq } from "@/components/AccordionFaq";

const FAQS = [
  {
    question: "How do I take a Feelz strip?",
    answer:
      "Open the pack, place the strip on your tongue, and let it dissolve naturally, no water needed. It melts within seconds, so you can use it anywhere.",
  },
  {
    question: "How quickly does Feelz work?",
    answer:
      "Since the strip dissolves in your mouth, the ingredients absorb through the oral mucosa, faster than a traditional tablet. Effectiveness varies by individual factors like body weight; Feelz is a supportive wellness tool, not an instant fix.",
  },
  {
    question: "When should I use each mood?",
    answer:
      "Focus sharpens mental clarity for work or study. Joy eases stress and low mood. Extrovert supports confidence before social situations. Rest helps you wind down before bed.",
  },
  {
    question: "Will Feelz make me feel sleepy or drowsy?",
    answer:
      "Only Rest is formulated to promote relaxation for bedtime. Focus, Joy, and Extrovert support clarity and balance without drowsiness, so they're fine for daytime use.",
  },
];

export function FaqSection() {
  return <AccordionFaq id="faq" heading="FAQ" items={FAQS} />;
}
