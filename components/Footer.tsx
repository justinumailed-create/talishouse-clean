import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#f5f5f7] py-12 text-[#2b2b2b]">
      <div className="container">
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
            <p className="text-sm leading-relaxed">
              Modern homes and cottages starting from $58.50 per sq.ft. . Built in a
              day, move-in ready in a week.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={ROUTES.HOME} className="hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CATALOG}
                  className="hover:text-black transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/add-project"
                  className="hover:text-black transition-colors"
                >
                  Add a Project
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4">
              Business Office
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT}
                  className="hover:text-black transition-colors"
                >
                  Propose a Project
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_REGISTER}
                  className="hover:text-black transition-colors"
                >
                  Register
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="hover:text-black transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.SUBSCRIPTION}
                  className="hover:text-black transition-colors"
                >
                  Partner Programs
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.LEASE_TO_OWN}
                  className="hover:text-black transition-colors"
                >
                  Lease-to-Own
                </GatedLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={ROUTES.ASSOCIATE_STATUS}
                  className="hover:text-black transition-colors"
                >
                  Associate Status
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="hover:text-black transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_LOGIN}
                  className="hover:text-black transition-colors"
                >
                  Admin Access
                </Link>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="hover:text-black transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Talishouse. All rights reserved.
          </p>
          <a 
            href="https://www.talisu.com" 
            target="_blank" 
            className="text-[10px] hover:text-black transition-colors"
          >
            Powered by TalisU
          </a>
        </div>
      </div>
    </footer>
  );
}
