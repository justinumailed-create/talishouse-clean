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

function getInitialAuthState() {
  if (typeof window === "undefined") {
    return {
      authorized: null,
      role: null,
      fastCode: null,
      loading: true,
    };
  }

  return {
    authorized: isAuthorized(),
    role: getRole(),
    fastCode: getFastCode(),
    loading: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialState = getInitialAuthState();
  const [authorized, setAuthorized] = useState<boolean | null>(initialState.authorized);
  const [role, setRole] = useState<"admin" | "associate" | null>(initialState.role);
  const [fastCode, setFastCode] = useState<string | null>(initialState.fastCode);
  const [loading] = useState(initialState.loading);

  useEffect(() => {
    const syncAuth = () => {
      setAuthorized(isAuthorized());
      setRole(getRole());
      setFastCode(getFastCode());
    };

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
  };

  const logout = () => {
    if (typeof window === "undefined") return;

    clearAdminSession();
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
