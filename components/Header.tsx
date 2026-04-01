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
    <header className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 transition-all duration-300">
      <div className="container-main h-full flex items-center justify-between">
        {/* LOGO (LEFT) */}
        <div className="flex-shrink-0">
          <Link href={ROUTES.HOME} className="flex items-center">
            <Image
              src="/logo.png"
              alt="TALISHOUSE logo"
              width={42}
              height={42}
              className="w-auto h-10 object-contain"
              priority
            />
          </Link>
        </div>

        {/* NAVIGATION & CART (RIGHT) */}
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={ROUTES.HOME}
              className={`text-[15px] font-medium transition-colors hover:text-black ${
                pathname === "/" ? "text-black" : "text-[#444]"
              }`}
            >
              Home
            </Link>
            <Link
              href={ROUTES.CATALOG}
              className={`text-[15px] font-medium transition-colors hover:text-black ${
                pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                  ? "text-black"
                  : "text-[#444]"
              }`}
            >
              Catalogue
            </Link>
            <GatedLink
              href={ROUTES.BUSINESS_OFFICE}
              className={`text-[15px] font-medium transition-colors hover:text-black ${
                pathname.startsWith("/business-office")
                  ? "text-black"
                  : "text-[#444]"
              }`}
            >
              Business Office
            </GatedLink>
          </nav>

          {/* CART (FAR RIGHT) */}
          <button
            onClick={openCart}
            className="group flex items-center gap-2 py-2 px-4 rounded-full border border-gray-200 hover:border-gray-900 transition-all duration-200"
          >
            <span className="text-[14px] font-medium text-[#444] group-hover:text-black">Cart</span>
            {itemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-black text-white text-[11px] font-bold rounded-full px-1">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
