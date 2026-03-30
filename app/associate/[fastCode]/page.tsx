import { getAssociates } from "@/lib/db";
import AssociateHero from "@/components/associate/AssociateHero";

interface PageConfig {
  heroType: "map" | "image" | "gallery" | "pdf" | "video";
  heroContent: string | string[];
  headline: string;
  subtext: string;
  ctaText: string;
  showForm: boolean;
  showVideo: boolean;
  videoUrl?: string;
}

export default async function AssociatePage({ params }: { params: Promise<{ fastCode?: string }> }) {
  const resolvedParams = await params;
  const fastCode = resolvedParams?.fastCode?.toUpperCase().trim() || "PREVIEW";

  // Get associate from file storage
  const associates = getAssociates();
  const associate = associates.find(a => a.fastCode === fastCode);

  const pageConfig = associate?.pageConfig || undefined;

  return <AssociateHero fastCode={fastCode} pageConfig={pageConfig} />;
}
