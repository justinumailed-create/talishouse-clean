import { getAssociates } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
  const fastCode = resolvedParams?.fastCode?.toUpperCase().trim();

  if (!fastCode || fastCode === "UNDEFINED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Associate Code</h1>
          <p className="text-gray-600">Please check the URL and try again.</p>
        </div>
      </div>
    );
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
          heroType: data.hero_type || "map",
          heroContent: data.hero_content || "",
          headline: data.page_headline || "",
          subtext: data.page_subtext || "",
          ctaText: data.page_contact_cta || "Propose a Project",
          showForm: data.show_form || false,
          showVideo: data.show_video || false,
          videoUrl: data.video_url || ""
        };
      }
    } catch (err) {
      console.error("Supabase fetch error for associate page:", err);
    }
  }

  // Fallback to file storage if not found in Supabase
  if (!pageConfig) {
    const associates = getAssociates();
    const associate = associates.find(a => a.fastCode === fastCode);
    pageConfig = associate?.pageConfig;
  }

  return <AssociateHero fastCode={fastCode} pageConfig={pageConfig} />;
}
