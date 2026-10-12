import SectionShell from "@/components/talisu/SectionShell";
import SeaCansLocalNav from "@/components/talisu/SeaCansLocalNav";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/blog");
}

/** Empty shell — no broken RSS feed. */
export default function TalisUBlogStubPage() {
  return (
    <SectionShell
      title="Blog"
      subtitle="No posts yet. Check back later — this stub replaces the empty RapidWeaver blog (no RSS)."
    >
      <SeaCansLocalNav />
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-500 shadow-sm">
        Coming soon.
      </div>
    </SectionShell>
  );
}
