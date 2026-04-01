"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Header() {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();

  return (
    <header className="bg-[#f5f5f5] border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-50">
      <div className="flex items-stretch">
        {/* LEFT: Vertical Navigation */}
        <nav className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 pb-2">
            <Link href={ROUTES.HOME} className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="TALISHOUSE logo"
                width={40}
                height={40}
                className="w-auto h-10 object-contain"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={openCart}
                className="relative p-2 text-gray-700 hover:text-black transition-all min-h-[48px] flex items-center justify-center"
                aria-label="Open cart"
              >
                <div className="relative inline-flex">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="
                      absolute -top-2 -right-2
                      min-w-[22px] h-[22px]
                      px-1
                      flex items-center justify-center
                      bg-[#0071e3]
                      text-white
                      text-[12px] font-semibold
                      rounded-full
                      leading-none
                      shadow-[0_1px_3px_rgba(0,0,0,0.2)]
                    ">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-4 pb-4">
            <Link
              href={ROUTES.CATALOG}
              className={`text-base font-semibold whitespace-nowrap transition-all leading-tight ${
                pathname.startsWith("/catalog")
                  ? "text-[#0070ba]"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Catalogue
            </Link>
            <GatedLink
              href={ROUTES.BUSINESS_OFFICE}
              className={`text-base font-semibold whitespace-nowrap transition-all leading-tight ${
                pathname.startsWith("/business-office")
                  ? "text-[#0070ba]"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Business Office
            </GatedLink>
          </div>
        </nav>

        {/* RIGHT: Social Media Icons (Future) */}
        <div className="w-16 flex items-center justify-center border-l border-[rgba(0,0,0,0.08)]">
          {/* Empty container for future social media icons */}
        </div>
      </div>
    </header>
  );
}