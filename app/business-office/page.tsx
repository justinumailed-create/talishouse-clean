"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/routes";
import GatedLink from "@/components/GatedLink";
import AuthGuard from "@/components/AuthGuard";

export default function BusinessOfficePage() {
  const [ready, setReady] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const auth = localStorage.getItem("auth");

    if (!auth) {
      window.location.href = "/";
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  const gatedItems = [
    { title: "Lease-to-Own", desc: "Refer projects for in-house financing", href: ROUTES.LEASE_TO_OWN },
    { title: "E-Commerce", desc: "Collect on your projects", href: ROUTES.BUSINESS_OFFICE_TRANSACTIONS },
    { title: "Partner Programs", desc: "Register an Associate account", href: ROUTES.SUBSCRIPTION },
  ];

  const publicItems = [
    { title: "Propose a Project", desc: "Start a side-business with Talispros™", href: ROUTES.BUSINESS_OFFICE_APPLY },
  ];

  return (
    <AuthGuard>
      <div className="w-full px-6 py-12">
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

        {publicItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

         <div className="mt-12 flex flex-col items-center gap-8">
          <button onClick={logout} className="text-sm text-red-500 hover:underline pointer-events-auto">
            Logout and Clear Session
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
