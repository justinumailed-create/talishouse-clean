"use client";

import { useEffect, useState } from "react";

export function useAdminAuth() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const fastCode = localStorage.getItem("fastCode");
    
    if (!storedRole || !fastCode) {
      window.location.href = "/admin/login";
      return;
    }

    setRole(storedRole);
  }, []);

  return { role };
}
