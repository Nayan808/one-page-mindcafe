import { ExpertDetailContent } from "@/components/ExpertDetailContent";

// Dynamic — experts aren't a small fixed set like therapy categories, so
// (unlike /therapy/[category]) this doesn't use generateStaticParams.
export default async function ExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExpertDetailContent expertId={id} />;
}
