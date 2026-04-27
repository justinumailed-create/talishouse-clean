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

export default async function MapsitePage({ params }: { params: Promise<{ slug?: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug?.toLowerCase().trim();

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Mapsite Slug</h1>
          <p className="text-gray-600">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  let pageConfig: PageConfig | undefined;
  let fastCode: string = "GLOBAL";

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("associates")
        .select("*")
        .eq("mapsite_slug", slug)
        .maybeSingle();

      if (data && !error) {
        fastCode = data.fast_code;
        pageConfig = {
          contentType: data.hero_type || "map",
          contentUrl: data.hero_content || "",
          headline: data.page_headline || data.name || "Mapsite",
          subtext: data.page_subtext || "Property Discovery Map",
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
      console.error("Supabase fetch error for mapsite page:", err);
    }
  }

  if (!pageConfig) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Mapsite Not Found</h1>
            <p className="text-gray-600">The requested mapsite could not be located.</p>
          </div>
        </div>
      );
  }

  return <AssociateHero fastCode={fastCode} pageConfig={pageConfig} />;
}
