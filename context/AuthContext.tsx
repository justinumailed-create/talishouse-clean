"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { clearAdminSession, getFastCode, getRole, isAuthorized, normalizeFastCode } from "@/lib/fast-code";

interface AuthContextType {
  authorized: boolean | null;
  role: "admin" | "associate" | null;
  fastCode: string | null;
  loading: boolean;
  login: (code: string, role: string, id?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** SSR-safe defaults — never read localStorage during the initial render. */
const SSR_AUTH_STATE = {
  authorized: null as boolean | null,
  role: null as "admin" | "associate" | null,
  fastCode: null as string | null,
  loading: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(SSR_AUTH_STATE.authorized);
  const [role, setRole] = useState<"admin" | "associate" | null>(SSR_AUTH_STATE.role);
  const [fastCode, setFastCode] = useState<string | null>(SSR_AUTH_STATE.fastCode);
  const [loading, setLoading] = useState(SSR_AUTH_STATE.loading);

  useEffect(() => {
    const syncAuth = () => {
      setAuthorized(isAuthorized());
      setRole(getRole());
      setFastCode(getFastCode());
      setLoading(false);
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const login = (code: string, r: string, id?: string) => {
    if (typeof window === "undefined") return;

    const normalizedCode = normalizeFastCode(code);
    if (!normalizedCode) return;

    localStorage.setItem("fast_code", normalizedCode);
    localStorage.setItem("role", r);
    if (id) {
      localStorage.setItem("associateId", id);
    } else {
      localStorage.removeItem("associateId");
    }

    setAuthorized(true);
    setRole(r as "admin" | "associate");
    setFastCode(normalizedCode);
    setLoading(false);
  };

  const logout = () => {
    if (typeof window === "undefined") return;

    clearAdminSession();
    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });

    setAuthorized(false);
    setRole(null);
    setFastCode(null);
    setLoading(false);

    window.location.href = "/";
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
