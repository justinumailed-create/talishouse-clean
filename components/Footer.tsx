import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";
import { formatCAD } from "@/utils/currency";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-gray-50 py-24 text-gray-700">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-[75px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[30%_20%_20%_20%] gap-16 lg:gap-24 mb-20 items-start">
          <div className="space-y-10 pr-12">
            <div className="w-full overflow-hidden">
              <Image
                src="/logo-windswept-white.svg"
                alt="Windswept"
                width={180}
                height={50}
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-[18px] text-gray-600 leading-relaxed max-w-sm">
              Modern homes and cottages starting from {formatCAD(58.50, false)} per sq.ft. Built in a
              day, move-in ready in a week.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-900 mb-8">
              Explore
            </h4>
            <ul className="space-y-5 text-[15px]">
              <li>
                <Link href={ROUTES.HOME} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CATALOG}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/add-project"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-900 mb-8">
              Business Office
            </h4>
            <ul className="space-y-5 text-[15px]">
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Propose a Project
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.SUBSCRIPTION}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Partner Programs
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.LEASE_TO_OWN}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Lease-to-Own
                </GatedLink>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-900 mb-8">
              Legal
            </h4>
            <ul className="space-y-5 text-[15px]">
              <li>
                <Link
                  href={ROUTES.ASSOCIATE_STATUS}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Associate Status
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_LOGIN}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Admin Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
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
