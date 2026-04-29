"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/business-office/apply"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Bypass auth completely for public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      return;
    }

    const token = localStorage.getItem("auth");

    if (!token) {
      window.location.href = "/";
    }
  }, [pathname]);

  return <>{children}</>;
}
