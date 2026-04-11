"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAuthorized, clearFastCode } from "@/lib/fast-code";
import { ROUTES } from "@/lib/routes";

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

  const publicItems = [
    { title: "Lease-to-Own", desc: "Propose projects for in-house financing", href: ROUTES.LEASE_TO_OWN },
  ];

  const gatedItems = authorized ? [
    { title: "Apply for Associate", desc: "Start a side-business with Talispros™", href: ROUTES.BUSINESS_OFFICE_APPLY },
    { title: "Propose a Project", desc: "Associate Status Required", href: ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT },
    { title: "E-Commerce", desc: "Collect on your projects", href: ROUTES.BUSINESS_OFFICE_TRANSACTIONS },
    { title: "Partner Programs", desc: "Register an Associate account", href: ROUTES.SUBSCRIPTION },
  ] : [];

  return (
    <div className="w-full px-6 lg:px-[80px] py-12">
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

      {publicItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

      <button onClick={handleLogout} className="text-sm text-red-500 hover:underline mt-8">
        Logout and Clear Session
      </button>
    </div>
  );
}
