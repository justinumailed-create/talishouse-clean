import { redirect } from "next/navigation";
import { getAssociates } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import AssociateHero from "@/components/associate/AssociateHero";

interface PageConfig {
  contentType: "map" | "pdf" | "image";
  contentUrl?: string;
  headline: string;
  subtext: string;
  ctaText: string;
  showForm: boolean;
  showVideo: boolean;
  videoUrl?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export default async function TTVAccessPage({ params }: { params: Promise<{ fastCode?: string }> }) {
  const resolvedParams = await params;
  const fastCode = resolvedParams?.fastCode?.toUpperCase().trim();

  if (!fastCode || fastCode === "UNDEFINED") {
    redirect("/partner-access");
  }

  let pageConfig: PageConfig | undefined;

  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("associates")
        .select("*")
        .eq("fast_code", fastCode)
        .maybeSingle();

      if (data && !error) {
        pageConfig = {
          contentType: data.hero_type || "map",
          contentUrl: data.hero_content || "",
          headline: data.page_headline || "",
          subtext: data.page_subtext || "",
          ctaText: data.page_contact_cta || "Refer a Project",
          showForm: data.show_form || false,
          showVideo: data.show_video || false,
          videoUrl: data.video_url || "",
          name: data.name,
          email: data.email,
          phone: data.phone,
        };
      }
    } catch (err) {
      console.error("Supabase fetch error for TTV access page:", err);
    }
  }

  // Fallback to file storage if not found in Supabase
  if (!pageConfig) {
    const associates = getAssociates();
    const associate = associates.find(a => a.fastCode === fastCode);
    pageConfig = associate?.pageConfig;
  }

  // If still not found, redirect to partner-access
  if (!pageConfig) {
    redirect("/partner-access");
  }

  return <AssociateHero fastCode={fastCode} pageConfig={pageConfig} />;
}
