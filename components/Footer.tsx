import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white text-gray-700">
      <div className="w-full px-6 lg:px-[80px] pt-8 pb-8 grid grid-cols-[28%_24%_24%_24%] gap-16 items-start">
        <div className="flex flex-col justify-start items-start">
          <div className="mb-3">
            <Image
              src="/logo.png"
              alt="Windswept Logo"
              width={120}
              height={32}
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>
          <div className="mt-7">
            <p className="footer-text text-[15px] text-neutral-700">
              Glasshouse™ and Talishouse™ Homes & Cottages from 160{"\u00A0"}sq.{"\u00A0"}ft. to 3,200{"\u00A0"}sq.{"\u00A0"}ft., modular, from $58.50 per{"\u00A0"}sq.{"\u00A0"}ft.. Up in a day, move in ready in a week. Lease-To-Own available, OAC.
            </p>
          </div>
        </div>

        <div className="items-start">
          <h4 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-gray-900">
            Explore
          </h4>
          <ul>
            <li className="mb-[10px]">
              <Link
                href={ROUTES.FIND_YOUR_HOME}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors font-medium"
              >
                Find Your Home
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link href={ROUTES.HOME} className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link
                href={ROUTES.CATALOG}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Catalogue
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link
                href="/add-project"
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Join Us
              </Link>
            </li>
          </ul>
        </div>

        <div className="items-start">
          <h4 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-gray-900">
            Business Office
          </h4>
          <ul>
            <li className="mb-[10px]">
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Propose a Project
              </GatedLink>
            </li>
            <li className="mb-[10px]">
              <GatedLink
                href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                SPLITS Portal
              </GatedLink>
            </li>
            <li className="mb-[10px]">
              <GatedLink
                href={ROUTES.SUBSCRIPTION}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Partner Programs
              </GatedLink>
            </li>
            <li className="mb-[10px]">
              <GatedLink
                href={ROUTES.LEASE_TO_OWN}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Lease-to-Own
              </GatedLink>
            </li>
          </ul>
        </div>

        <div className="items-start">
          <h4 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-gray-900">
            Legal
          </h4>
          <ul>
            <li className="mb-[10px]">
              <Link
                href={ROUTES.ASSOCIATE_STATUS}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Associate Status
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link href={ROUTES.TERMS} className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link
                href={ROUTES.PRIVACY}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li className="mb-[10px]">
              <Link
                href={ROUTES.ADMIN_LOGIN}
                className="text-[15px] leading-[1.8] text-neutral-700 hover:text-gray-900 transition-colors"
              >
                Admin Access
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full px-6 lg:px-[80px] pb-8">
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
