import { notFound } from "next/navigation";
import { FeelzProductPageContent } from "@/components/feelz/FeelzProductPageContent";
import { MOOD_GRID } from "@/lib/moodStyles";
import type { FeelzMoodKey } from "@/lib/feelzIngredients";

export async function generateStaticParams() {
  return MOOD_GRID.map((m) => ({ mood: m.key }));
}

export default async function FeelzProductPage({ params }: { params: Promise<{ mood: string }> }) {
  const { mood } = await params;
  if (!MOOD_GRID.some((m) => m.key === mood)) notFound();
  return <FeelzProductPageContent mood={mood as FeelzMoodKey} />;
}
