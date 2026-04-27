import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import AssociateHero from "@/components/associate/AssociateHero";

export default async function MapsiteRouterPage() {
  // Try to find the first enabled associate with a slug
  const { data: associate } = await supabase
    .from("associates")
    .select("mapsite_slug")
    .eq("is_page_enabled", true)
    .not("mapsite_slug", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (associate?.mapsite_slug) {
    redirect(`/mapsite/${associate.mapsite_slug}`);
  }

  // Fallback / Demo Page if no associates exist
  const pageConfig = {
    contentType: "image" as const,
    contentUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    headline: "DEMO PARTNER",
    subtext: "Explore our premium modular home solutions and property discovery tools. This is a demo mapsite showing the associate experience.",
    ctaText: "Refer a Project",
    showForm: true,
    showVideo: true,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    name: "Demo Partner",
  };

  return <AssociateHero fastCode="GLOBAL" pageConfig={pageConfig} />;
}
