import ProtectedContactReveal from "@/components/talispros/personal-home/ProtectedContactReveal";

interface MapSiteFooterProps {
  fastCode: string;
  agentName: string;
  hasEmail?: boolean;
  updatedAt: string;
}

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MapSiteFooter({
  fastCode,
  agentName,
  hasEmail = false,
  updatedAt,
}: MapSiteFooterProps) {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-8 sm:mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{agentName}</p>
            {hasEmail ? (
              <ProtectedContactReveal
                code={fastCode}
                field="email"
                surface="mapsite"
                className="text-sm text-neutral-500 mt-1"
                testId="mapsite-footer-contact-email"
              />
            ) : null}
            <p className="text-xs font-mono text-neutral-400 mt-3">{fastCode}</p>
          </div>
          <p className="text-xs text-neutral-400">
            Updated {formatUpdatedAt(updatedAt)}
          </p>
        </div>
      </div>
    </footer>
  );
}
