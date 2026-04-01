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
    <>
      {/* LEFT SIDEBAR - HIDDEN ON MOBILE */}
      <aside className="hidden md:flex fixed left-0 top-0 w-[220px] h-screen bg-[#f5f5f5] border-r border-[#e5e5e5] z-50 flex flex-col">
        {/* LOGO */}
        <div className="p-5 border-b border-[#e5e5e5]">
          <Link href={ROUTES.HOME}>
            <Image
              src="/logo.png"
              alt="TALISHOUSE logo"
              width={40}
              height={40}
              className="w-auto h-10 object-contain"
              priority
            />
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-4">
          <Link
            href={ROUTES.CATALOG}
            className={`text-[17px] font-medium transition-all py-2 ${
              pathname.startsWith("/catalog")
                ? "text-[#111]"
                : "text-[#222] hover:text-black"
            }`}
          >
            Catalogue
          </Link>
          <Link
            href={ROUTES.LEASE_TO_OWN}
            className={`text-[17px] font-medium transition-all py-2 ${
              pathname.startsWith("/lease-to-own")
                ? "text-[#111]"
                : "text-[#222] hover:text-black"
            }`}
          >
            Lease-To-Own
          </Link>
          <GatedLink
            href={ROUTES.BUSINESS_OFFICE}
            className={`text-[17px] font-medium transition-all py-2 ${
              pathname.startsWith("/business-office")
                ? "text-[#111]"
                : "text-[#222] hover:text-black"
            }`}
          >
            Business Office
          </GatedLink>
          <Link
            href={ROUTES.ADD_PROJECT}
            className={`text-[17px] font-medium transition-all py-2 ${
              pathname.startsWith("/add-project")
                ? "text-[#111]"
                : "text-[#222] hover:text-black"
            }`}
          >
            Add A Project
          </Link>
        </nav>

        {/* CART BUTTON */}
        <div className="p-4 border-t border-[#e5e5e5]">
          <button
            onClick={openCart}
            className="w-full flex items-center justify-between py-3 px-4 bg-white border border-[#e5e5e5] rounded-lg hover:border-gray-400 transition-all"
          >
            <span className="text-[15px] font-medium text-[#222]">Cart</span>
            {itemCount > 0 && (
              <span className="bg-[#0071e3] text-white text-[12px] font-semibold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* TOP HEADER CONTAINER - ADJUSTED FOR MOBILE */}
      <header className="fixed top-0 right-0 left-0 md:left-[220px] h-16 bg-white border-b border-[#e5e5e5] z-40">
        <div className="header-right h-full flex items-center justify-between md:justify-end px-6">
          {/* MOBILE LOGO */}
          <div className="md:hidden">
            <Link href={ROUTES.HOME}>
              <Image
                src="/logo.png"
                alt="TALISHOUSE logo"
                width={32}
                height={32}
                className="w-auto h-8 object-contain"
                priority
              />
            </Link>
          </div>
          {/* Empty - for future social media icons */}
        </div>
      </header>
    </>
  );
}
