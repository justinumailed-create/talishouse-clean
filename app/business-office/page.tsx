"use client";

import { useState, useEffect } from "react";
import GatedLink from "@/components/GatedLink";
import { isAuthorized, clearFastCode } from "@/lib/fast-code";
import FastCodeGate from "@/components/FastCodeGate";
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

  if (!authorized) {
    return <FastCodeGate />;
  }

  const cardItems = [
    { title: "Propose a Project", desc: "Start a new build proposal", href: ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT },
    { title: "Apply for Associate", desc: "Join as a partner", href: ROUTES.BUSINESS_OFFICE_APPLY },
    { title: "Register", desc: "Create your account", href: ROUTES.BUSINESS_OFFICE_REGISTER },
    { title: "SPLITS Portal", desc: "Manage transactions", href: ROUTES.BUSINESS_OFFICE_TRANSACTIONS },
    { title: "Partner Programs", desc: "Explore collaborations", href: ROUTES.SUBSCRIPTION },
    { title: "Lease-to-Own", desc: "Flexible ownership plans", href: ROUTES.LEASE_TO_OWN }
  ];

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8 text-center">
        Business Office
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardItems.map((item, i) => (
          <div
            key={i}
            className="
              rounded-2xl border border-[rgba(0,0,0,0.06)]
              bg-white p-6 transition-all duration-300
              hover:shadow-md hover:-translate-y-[2px]
            "
          >
            <h2 className="text-lg font-medium mb-1">
              {item.title}
            </h2>
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

      <div className="text-center mt-10">
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          Logout and Clear Session
        </button>
      </div>
    </div>
  );
}
