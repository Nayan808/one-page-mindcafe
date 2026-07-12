import { TherapyCategoryContent } from "@/components/TherapyCategoryContent";
import { VALID_CATEGORY_SLUGS } from "@/lib/therapyCategories";

// One shared client component driven by the :category param (spec 4.8) —
// server wrapper just awaits the async params Next.js hands page.tsx now,
// then hands the plain string down.
export async function generateStaticParams() {
  return VALID_CATEGORY_SLUGS.map((category) => ({ category }));
}

export default async function TherapyCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <TherapyCategoryContent category={category} />;
}
