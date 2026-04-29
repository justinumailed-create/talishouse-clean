import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white text-gray-700 mt-12">
      <div className="max-w-[1400px] mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
        <div className="flex flex-col gap-6">
          <Link href={ROUTES.HOME} className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Windswept Logo"
              width={120}
              height={32}
              className="h-6 md:h-8 w-auto object-contain"
            />
          </Link>
          <p className="text-[15px] leading-relaxed text-neutral-600 max-w-sm">
            Glasshouse™ 160 and 200, Talishouse™ 400 and 800, and Talishouse™ 1,600 plus. Modular. From $62.50 per sq. ft.. Up in a day, finished in a week. Lease-To-Own available, OAC.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-[13px] font-semibold tracking-widest text-gray-900 uppercase">
            Explore
          </h4>
          <ul className="space-y-3">
            <li>
              <Link
                href={ROUTES.FIND_YOUR_HOME}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Find Your Home
              </Link>
            </li>
            <li>
              <Link href={ROUTES.HOME} className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.CATALOG}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Catalogue
              </Link>
            </li>
            <li>
              <Link
                href="/add-project"
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Join Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-[13px] font-semibold tracking-widest text-gray-900 uppercase">
            Business Office
          </h4>
          <ul className="space-y-3">
            <li>
              <GatedLink
                href={ROUTES.LEASE_TO_OWN}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Lease-to-Own
              </GatedLink>
            </li>
            <li>
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                E-Commerce
              </GatedLink>
            </li>
            <li>
              <GatedLink
                href={ROUTES.SUBSCRIPTION}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Partner Programs
              </GatedLink>
            </li>
            <li>
              <Link
                href={ROUTES.BUSINESS_OFFICE_APPLY}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Propose a Project
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:text-right">
          <h4 className="mb-4 text-[13px] font-semibold tracking-widest text-gray-900 uppercase">
            Legal
          </h4>
          <ul className="space-y-3">
            <li>
              <Link
                href={ROUTES.ASSOCIATE_STATUS}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Associate Status
              </Link>
            </li>
            <li>
              <Link href={ROUTES.TERMS} className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.PRIVACY}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.ADMIN_LOGIN}
                className="text-[15px] text-neutral-600 hover:text-gray-900 transition-colors"
              >
                Admin Access
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 pb-8">
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Talishouse. All rights reserved.
          </p>
          <a
            href="https://www.talisu.com"
            target="_blank"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by TalisU
          </a>
        </div>
      </div>
    </footer>
  );
}
