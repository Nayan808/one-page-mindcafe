import { AccordionFaq } from "@/components/AccordionFaq";

const FAQS = [
  {
    question: "What is Feelz?",
    answer:
      "Feelz is a wellness brand by Mindcafe offering melt-in-mouth wellness strips designed around everyday mental states including focus, emotional wellbeing, social confidence and rest.",
  },
  {
    question: "Is Feelz a medicine?",
    answer: "No. Feelz is a wellness product. It is not intended to diagnose, treat, cure or prevent any disease.",
  },
  {
    question: "Does Feelz replace therapy?",
    answer:
      "No. Feelz is designed for everyday wellness and is not a replacement for therapy, counselling or professional medical care.",
  },
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
  {
    question: "How many strips can I take?",
    answer:
      "Always follow the usage instructions on your respective Feelz pack. Rest contains melatonin, so it's limited to one strip every 24 hours — skip driving or machinery use right after.",
  },
  {
    question: "Where can I buy Feelz?",
    answer: "You can order Feelz online right here, or find it at selected Zostel properties across India.",
  },
  {
    question: "Are Feelz ingredients based on Ayurveda?",
    answer: "Feelz uses formulations inspired by Ayurvedic ingredient traditions alongside modern formulation principles.",
  },
];

export function FaqSection() {
  return <AccordionFaq id="faq" heading="FAQ" items={FAQS} />;
}
