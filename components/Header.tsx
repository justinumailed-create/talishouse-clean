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
      <div className="w-full px-6 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* LEFT: Logo + Navigation */}
          <div className="flex items-center gap-8">
            <Link href={ROUTES.HOME} className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="TALISHOUSE logo"
                width={36}
                height={36}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.HOME}
                className={`text-gray-700 uppercase tracking-wide text-sm font-medium hover:text-black transition-colors ${
                  pathname === "/" ? "text-black" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href={ROUTES.CATALOG}
                className={`text-gray-700 uppercase tracking-wide text-sm font-medium hover:text-black transition-colors ${
                  pathname.startsWith("/catalog") || pathname.startsWith("/catalogue")
                    ? "text-black"
                    : ""
                }`}
              >
                Catalogue
              </Link>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE}
                className={`text-gray-700 uppercase tracking-wide text-sm font-medium hover:text-black transition-colors ${
                  pathname.startsWith("/business-office")
                    ? "text-black"
                    : ""
                }`}
              >
                Business Office
              </GatedLink>
            </nav>
          </div>

          {/* RIGHT: Cart + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={openCart}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-gray-900 text-white text-[11px] font-bold rounded-full">
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
