import Link from "next/link";
import TalisprosMarketsDropdown from "@/components/talispros/TalisprosMarketsDropdown";

export default function TalisprosMarketNav() {
  return (
    <nav className="flex-shrink-0 border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-center gap-8">
        <Link
          href="/"
          className="text-[11px] tracking-[0.08em] text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Welcome
        </Link>
        <TalisprosMarketsDropdown />
      </div>
    </nav>
  );
}
