import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";

export const metadata = createTalisUMetadata({
  title: "TalisU Sea-Cans | Blog",
  description: "TalisU Sea-Cans blog — coming soon.",
  path: "/talisu/blog",
  private: true,
});

/** Empty shell — no broken RSS feed. */
export default function TalisUBlogStubPage() {
  return (
    <SectionShell
      title="Blog"
      subtitle="No posts yet. Check back later — this stub replaces the empty RapidWeaver blog (no RSS)."
    >
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center text-sm text-white/50">
        Coming soon.
      </div>
    </SectionShell>
  );
}
