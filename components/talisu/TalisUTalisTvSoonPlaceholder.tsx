import { TALISU_CARD } from "@/lib/talisu/ui";

/**
 * Temporary Audio / Video hub placeholder.
 * Underlying library data and components are kept — restore by rendering
 * them from app/talisu/au/page.tsx and app/talisu/video/page.tsx again.
 */
export default function TalisUTalisTvSoonPlaceholder() {
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center px-4 py-16">
      <div
        className={`${TALISU_CARD} flex max-w-xl flex-col items-center px-8 py-16 text-center ring-[#046BD9]/15`}
      >
        <p className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          All Contents will be posted on TalisTV soon!
        </p>
      </div>
    </div>
  );
}
