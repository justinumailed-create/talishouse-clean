"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAuthorized, clearFastCode } from "@/lib/fast-code";
import { ROUTES } from "@/lib/routes";
import GatedLink from "@/components/GatedLink";

export default function BusinessOfficePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthorized(isAuthorized());
  }, []);

  const handleLogout = () => {
    clearFastCode();
    window.location.reload();
  };

  if (authorized === null) return null;

  const publicItems: { title: string; desc: string; href: string }[] = [];

  const gatedItems = [
    { title: "Lease-to-Own", desc: "Refer projects for in-house financing", href: ROUTES.LEASE_TO_OWN },
    { title: "E-Commerce", desc: "Collect on your projects", href: ROUTES.BUSINESS_OFFICE_TRANSACTIONS },
    { title: "Partner Programs", desc: "Register an Associate account", href: ROUTES.SUBSCRIPTION },
    { title: "Propose a Project", desc: "Start a side-business with Talispros™", href: ROUTES.BUSINESS_OFFICE_APPLY },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">
        Join Us <span className="font-normal text-gray-400">Moonlighting is Lucrative!</span>
      </h1>

      {gatedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gatedItems.map((item, i) => (
            <div
              key={i}
              className="
                rounded-2xl border border-[rgba(0,0,0,0.06)]
                bg-white p-6 transition-all duration-300
                hover:shadow-md hover:-translate-y-[2px]
              "
            >
              <h3 className="text-lg font-medium mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {item.desc}
              </p>

              <GatedLink
                href={item.href}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition text-center block bg-gray-100 hover:bg-gray-200 text-gray-900"
              >
                Open
              </GatedLink>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-8">
        {publicItems.length > 0 && (
          <div className="w-full max-w-md">
            {publicItems.map((item, i) => (
              <div
                key={i}
                className="
                  rounded-2xl border border-[rgba(0,0,0,0.06)]
                  bg-white p-6 transition-all duration-300
                  hover:shadow-md hover:-translate-y-[2px]
                "
              >
                <h3 className="text-lg font-medium mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {item.desc}
                </p>

                <Link
                  href={item.href}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition text-center block bg-gray-100 hover:bg-gray-200 text-gray-900"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}

        {authorized && (
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Logout and Clear Session
          </button>
        )}
      </div>
    </div>
  );
}
