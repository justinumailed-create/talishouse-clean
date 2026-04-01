import Link from "next/link";
import Image from "next/image";
import GatedLink from "./GatedLink";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#f5f5f7] py-12">
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
            <p className="text-sm text-[#6e6e73] leading-relaxed">
              Modern homes and cottages starting from $58.50 per sq.ft. . Built in a
              day, move-in ready in a week.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#1d1d1f] mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-sm text-[#6e6e73]">
              <li>
                <Link href={ROUTES.HOME} className="hover:text-[#0070ba] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CATALOG}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/add-project"
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Add a Project
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#1d1d1f] mb-4">
              Business Office
            </h4>
            <ul className="space-y-3 text-sm text-[#6e6e73]">
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Propose a Project
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_REGISTER}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Register
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.SUBSCRIPTION}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Partner Programs
                </GatedLink>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.LEASE_TO_OWN}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Lease-to-Own
                </GatedLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#1d1d1f] mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-[#6e6e73]">
              <li>
                <Link
                  href={ROUTES.ASSOCIATE_STATUS}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Associate Status
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="hover:text-[#0070ba] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_LOGIN}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  Admin Access
                </Link>
              </li>
              <li>
                <GatedLink
                  href={ROUTES.BUSINESS_OFFICE_TRANSACTIONS}
                  className="hover:text-[#0070ba] transition-colors"
                >
                  SPLITS Portal
                </GatedLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#86868b]">
            &copy; {new Date().getFullYear()} Talishouse. All rights reserved.
          </p>
          <a 
            href="https://www.talisu.com" 
            target="_blank" 
            className="text-[10px] text-[#86868b] hover:text-[#0070ba] transition-colors"
          >
            Powered by TalisU
          </a>
        </div>
        <div className="pt-4 text-center">
          <p className="text-sm font-semibold text-gray-700">Moonlighting is lucrative</p>
        </div>
      </div>
    </footer>
  );
}
