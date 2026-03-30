"use client";

/**
 * FAST Code Utilities for Access Control
 * Persists FAST Code in localStorage for session management.
 */

export const setFastCode = (code: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("fast_code", code.toUpperCase());
  }
};

export const getFastCode = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("fast_code");
  }
  return null;
};

export const clearFastCode = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fast_code");
    localStorage.removeItem("role");
    localStorage.removeItem("associateId");
  }
};

export const isAuthorized = (): boolean => {
  const code = getFastCode();
  return !!code && code.trim() !== "";
};

export const isSuperAdmin = (): boolean => {
  const code = getFastCode();
  return code === "ADMIN123";
};

export const getRole = (): "admin" | "associate" | null => {
  if (!isAuthorized()) return null;
  return isSuperAdmin() ? "admin" : "associate";
};
