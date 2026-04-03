import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-gray-50 py-12 text-gray-700">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="w-full overflow-hidden">
              <Image
                src="/logo.png"
                alt="TALISHOUSE logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Modern homes and cottages starting from $58.50 per sq.ft. Built in a
              day, move-in ready in a week.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={ROUTES.HOME} className="text-gray-500 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CATALOG}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/add-project"
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Add a Project
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-4">
              Business Office
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Propose a Project
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.SUBSCRIPTION}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Partner Programs
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.LEASE_TO_OWN}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Lease-to-Own
                </GatedLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={ROUTES.ASSOCIATE_STATUS}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Associate Status
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="text-gray-500 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_LOGIN}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Admin Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

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
