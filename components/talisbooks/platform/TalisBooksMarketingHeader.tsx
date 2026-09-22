"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { shouldShowTalisbooksMarketingHeader } from "@/lib/talisbooks/marketing-chrome";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export default function TalisBooksMarketingHeader() {
  const pathname = usePathname();

  if (!shouldShowTalisbooksMarketingHeader(pathname)) {
    return null;
  }

  return (
    <header className="shrink-0 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center px-6 lg:px-8">
        <Link href={TALISBOOKS_ROUTES.HOME} className="group flex items-center gap-3 no-underline">
          <Image
            src="/logo.png"
            alt={TALISBOOKS_PRODUCT_NAME}
            width={32}
            height={32}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600">
            {TALISBOOKS_PRODUCT_NAME}
          </span>
        </Link>
      </div>
    </header>
  );
}
