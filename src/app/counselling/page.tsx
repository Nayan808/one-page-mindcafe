import { CounsellingHero } from "@/components/CounsellingHero";
import { NotSureWhereToStartBanner } from "@/components/NotSureWhereToStartBanner";
import { CounsellingHowItWorks } from "@/components/CounsellingHowItWorks";
import { TherapyCategoryPicker } from "@/components/TherapyCategoryPicker";
import { ExpertsTeaserSection } from "@/components/ExpertsTeaserSection";
import { CounsellingPrivacySection } from "@/components/CounsellingPrivacySection";
import { CounsellingConcernsSection } from "@/components/CounsellingConcernsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CounsellingFaqSection } from "@/components/CounsellingFaqSection";

export default function CounsellingPage() {
  return (
    <>
      <CounsellingHero />
      <NotSureWhereToStartBanner />
      <CounsellingHowItWorks />
      <TherapyCategoryPicker />
      <ExpertsTeaserSection />
      <CounsellingPrivacySection />
      <CounsellingConcernsSection />
      <TestimonialsSection />
      <div className="bg-white">
        <CounsellingFaqSection />
      </div>
    </>
  );
}
