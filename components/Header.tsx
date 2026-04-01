"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Header() {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar sticky top-0 bg-white z-[100] border-b border-[#eee]">
      <div className="container max-w-[1400px] mx-auto px-4">
        <div className="nav-inner flex items-center justify-between h-20">
          {/* LOGO (LEFT) */}
          <div className="logo flex-shrink-0">
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

          {/* RIGHT NAVIGATION & CART */}
          <div className="nav-right flex items-center ml-auto gap-6">
            <nav className="nav-links hidden md:flex items-center gap-[24px]">
              <Link
                href={ROUTES.HOME}
                className={`text-base font-medium uppercase tracking-[0.05em] transition-colors hover:text-black ${
                  pathname === "/" ? "text-black" : "text-[#444]"
                }`}
              >
                Home
              </Link>
              <Link
                href={ROUTES.CATALOG}
                className={`text-base font-medium uppercase tracking-[0.05em] transition-colors hover:text-black ${
                  pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                    ? "text-black"
                    : "text-[#444]"
                }`}
              >
                Catalogue
              </Link>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE}
                className={`text-base font-medium uppercase tracking-[0.05em] transition-colors hover:text-black ${
                  pathname.startsWith("/business-office")
                    ? "text-black"
                    : "text-[#444]"
                }`}
              >
                Business Office
              </GatedLink>
            </nav>

            {/* CART & MOBILE TOGGLE */}
            <div className="cart flex items-center gap-4 ml-2">
              <button
                onClick={openCart}
                className="group flex items-center gap-2 py-2 px-4 rounded-full border border-gray-200 hover:border-gray-900 transition-all duration-200"
              >
                <span className="text-[14px] font-medium text-[#444] group-hover:text-black uppercase tracking-[0.05em]">Cart</span>
                {itemCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-black text-white text-[11px] font-bold rounded-full px-1">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* HAMBURGER MENU (MOBILE ONLY) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-[#444] hover:text-black"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#eee] flex flex-col gap-4">
            <Link
              href={ROUTES.HOME}
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-medium uppercase tracking-[0.05em] px-2 transition-colors hover:text-black ${
                pathname === "/" ? "text-black" : "text-[#444]"
              }`}
            >
              Home
            </Link>
            <Link
              href={ROUTES.CATALOG}
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-medium uppercase tracking-[0.05em] px-2 transition-colors hover:text-black ${
                pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                  ? "text-black"
                  : "text-[#444]"
              }`}
            >
              Catalogue
            </Link>
            <div onClick={() => setIsMenuOpen(false)}>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE}
                className={`text-base font-medium uppercase tracking-[0.05em] px-2 transition-colors hover:text-black ${
                  pathname.startsWith("/business-office")
                    ? "text-black"
                    : "text-[#444]"
                }`}
              >
                Business Office
              </GatedLink>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
