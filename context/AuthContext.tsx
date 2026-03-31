"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { isAuthorized, getRole, getFastCode } from "@/lib/fast-code";

interface AuthContextType {
  authorized: boolean | null;
  role: "admin" | "associate" | null;
  fastCode: string | null;
  loading: boolean;
  login: (code: string, role: string, id?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [role, setRole] = useState<"admin" | "associate" | null>(null);
  const [fastCode, setFastCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    if (typeof window === "undefined") return;
    
    const auth = isAuthorized();
    const r = getRole() as "admin" | "associate" | null;
    const code = getFastCode();
    
    setAuthorized(auth);
    setRole(r);
    setFastCode(code);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for storage events to sync across tabs
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const login = (code: string, r: string, id?: string) => {
    if (typeof window === "undefined") return;
    
    const normalizedCode = (code || "").toUpperCase().trim();
    if (!normalizedCode) return;

    localStorage.setItem("fast_code", normalizedCode);
    localStorage.setItem("role", r);
    if (id) localStorage.setItem("associateId", id);
    
    // Set cookie for middleware/persistence - Secure + SameSite=Lax
    const secure = window.location.protocol === "https:" ? "Secure;" : "";
    document.cookie = `admin_session=${normalizedCode}; path=/; max-age=86400; ${secure} SameSite=Lax`;
    
    setAuthorized(true);
    setRole(r as any);
    setFastCode(normalizedCode);
  };

  const logout = () => {
    if (typeof window === "undefined") return;
    
    localStorage.removeItem("fast_code");
    localStorage.removeItem("role");
    localStorage.removeItem("associateId");
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    setAuthorized(false);
    setRole(null);
    setFastCode(null);
  };

  return (
    <AuthContext.Provider value={{ authorized, role, fastCode, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
