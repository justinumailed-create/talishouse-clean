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
    { title: "Obtain FAST Code", desc: "Get your access code to proceed", href: ROUTES.ADD_PROJECT },
    { title: "Return to Homepage", desc: "Go back to main site", href: ROUTES.HOME },
    { title: "Lease-to-Own", desc: "Flexible ownership plans", href: ROUTES.LEASE_TO_OWN },
  ];

  const gatedItems = authorized ? [
    { title: "Propose a Project", desc: "Start a new build proposal", href: ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT },
    { title: "Apply for Associate", desc: "Join as a partner", href: ROUTES.BUSINESS_OFFICE_APPLY },
    { title: "SPLITS Portal", desc: "Manage transactions", href: ROUTES.BUSINESS_OFFICE_TRANSACTIONS },
    { title: "Partner Programs", desc: "Explore collaborations", href: ROUTES.SUBSCRIPTION },
  ] : [];

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8 text-center">
        Business Office
      </h1>

      {gatedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-gray-700">Authorized Access</h2>
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
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium mb-4 text-gray-700">
          {authorized ? "General Access" : "Quick Links"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      <div className="text-center mt-10">
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          Logout and Clear Session
        </button>
      </div>
    </div>
  );
}
