import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { mapsiteShareOgPath } from "@/lib/share/og-card";
import { getAssociates } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import AssociateHero from "@/components/associate/AssociateHero";
import { getAgentByLoginId } from "@/lib/agent-admins";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode?: string }>;
}) {
  const code = ((await params)?.fastCode ?? "").toUpperCase().trim();
  return dynamicPageMetadata((locale) => ({
    title: locale === "de" ? `Associate-Mapsite ${code} | Talispros™` : `Associate Mapsite ${code} | Talispros™`,
    description: locale === "de" ? `Öffnen Sie die Talispros™ Associate-Mapsite zum FAST Code ${code}.` : `Open the Talispros™ associate Mapsite for FAST Code ${code}.`,
    path: `/associate/${encodeURIComponent(code)}`,
    image: mapsiteShareOgPath(code || "allpins"),
  }));
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
      console.error("Supabase fetch error for associate page:", err);
    }
  }

  // Agent Admin landing page (agent_admins, server-side only; active agents).
  if (!pageConfig) {
    const agent = await getAgentByLoginId(fastCode, { activeOnly: true }).catch(() => null);
    if (agent) {
      pageConfig = {
        contentType: "map",
        contentUrl: "",
        headline: agent.pageHeadline || agent.name,
        subtext: agent.pageSubtext || agent.pageBio || "",
        ctaText: agent.pageCta || "Refer a Project",
        showForm: agent.showContactForm,
        showVideo: Boolean(agent.videoUrl),
        videoUrl: agent.videoUrl || "",
        name: agent.name,
        email: agent.email || undefined,
        phone: agent.phone || undefined,
      };
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
