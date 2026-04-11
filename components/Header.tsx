"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";
import { ShoppingCart } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-gray-100">
      <div className="w-full px-6 lg:px-[80px]">
        <div className="flex justify-between items-center h-24">
          {/* LEFT: Logo + Navigation */}
          <div className="flex items-center gap-8">
            <Link href={ROUTES.HOME} className="flex items-center flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Windswept Logo"
                width={120}
                height={32}
                className="h-6 md:h-8 w-auto object-contain"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              <Link
                href={ROUTES.HOME}
                className={`text-[15px] uppercase tracking-wider font-medium transition-colors hover:text-black ${
                  pathname === "/" ? "text-black" : "text-gray-500"
                }`}
              >
                Home
              </Link>
              <Link
                href={ROUTES.CATALOG}
                className={`text-[15px] uppercase tracking-wider font-medium transition-colors hover:text-black ${
                  pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                    ? "text-black"
                    : "text-gray-500"
                }`}
              >
                Catalogue
              </Link>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE}
                className={`text-[15px] uppercase tracking-wider font-medium transition-colors hover:text-black ${
                  pathname.startsWith("/business-office")
                    ? "text-black"
                    : "text-gray-500"
                }`}
              >
                Business Office
              </GatedLink>
            </nav>
          </div>

          {/* RIGHT: Cart + Mobile Toggle */}
          <div className="flex items-center gap-6">
            <button
              onClick={openCart}
              className="relative p-2 text-gray-500 hover:text-black transition-colors"
              aria-label="View cart"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5"
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

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <Link
              href={ROUTES.HOME}
              onClick={() => setIsMenuOpen(false)}
              className={`text-gray-700 uppercase tracking-wide text-sm font-medium px-2 transition-colors hover:text-black ${
                pathname === "/" ? "text-black" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href={ROUTES.CATALOG}
              onClick={() => setIsMenuOpen(false)}
              className={`text-gray-700 uppercase tracking-wide text-sm font-medium px-2 transition-colors hover:text-black ${
                pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                  ? "text-black"
                  : ""
              }`}
            >
              Catalogue
            </Link>
            <div onClick={() => setIsMenuOpen(false)}>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE}
                className={`text-gray-700 uppercase tracking-wide text-sm font-medium px-2 transition-colors hover:text-black ${
                  pathname.startsWith("/business-office")
                    ? "text-black"
                    : ""
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
