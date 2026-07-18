import { CounsellingHero } from "@/components/CounsellingHero";
import { CounsellingHowItWorks } from "@/components/CounsellingHowItWorks";
import { TherapyCategoryPicker } from "@/components/TherapyCategoryPicker";
import { ExpertsTeaserSection } from "@/components/ExpertsTeaserSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CounsellingFaqSection } from "@/components/CounsellingFaqSection";

export default function CounsellingPage() {
  return (
    <>
      <CounsellingHero />
      <CounsellingHowItWorks />
      <TherapyCategoryPicker />
      <ExpertsTeaserSection />
      <TestimonialsSection />
      <div className="bg-white">
        <CounsellingFaqSection />
      </div>
    </>
  );
}
