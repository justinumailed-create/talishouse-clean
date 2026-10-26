"use client";

import {
  ADMIN_SESSION_COOKIE,
  isGlobalAdminFastCode,
} from "./admin-constants";

export { ADMIN_SESSION_COOKIE };

const isBrowser = () => typeof window !== "undefined";

export const normalizeFastCode = (code: string) => (code || "").trim().toUpperCase();

const clearCookie = (name: string) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const setFastCode = (code: string) => {
  if (!isBrowser()) return;
  localStorage.setItem("fast_code", normalizeFastCode(code));
};

export const getFastCode = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem("fast_code");
};

export const clearFastCode = () => {
  if (!isBrowser()) return;
  localStorage.removeItem("fast_code");
  localStorage.removeItem("role");
  localStorage.removeItem("associateId");
};

/**
 * Client companion to the httpOnly `admin_session` cookie (set only by
 * `loginAdminWithFastCodeAction`). localStorage is used by Live Edit / gates
 * and is never treated as Global Admin authentication on its own.
 */
/** Call only after the server login action confirmed the code (grants live in the DB). */
export const setAdminSession = (code: string) => {
  if (!isBrowser()) return;

  const sessionCode = normalizeFastCode(code);
  // Retired codes are refused by the server login action before this runs.
  if (!sessionCode) return;

  localStorage.setItem("fast_code", sessionCode);
  localStorage.setItem("role", "admin");
  localStorage.removeItem("associateId");
};

export const clearAdminSession = () => {
  clearFastCode();
  clearCookie(ADMIN_SESSION_COOKIE);
};

/**
 * Client-visible admin hint only. The httpOnly admin cookie cannot be read
 * here — Global Admin rendering must use the server-confirmed session.
 */
export const hasAdminSession = (): boolean => {
  // httpOnly `admin_session` is not readable in the browser. Mapsite FAST
  // codes in localStorage (including RM22) must never look like Global Admin.
  return false;
};

/** Client hint only: the Global Admin code. Granted admins are confirmed server-side. */
export const isValidAdminFastCode = (code: string): boolean => {
  return isGlobalAdminFastCode(code);
};

export const isAuthorized = (): boolean => {
  const code = getFastCode();
  return !!code && code.trim() !== "";
};

export const isSuperAdmin = (): boolean => {
  return isGlobalAdminFastCode(getFastCode());
};

export const getRole = (): "admin" | "associate" | null => {
  if (!isAuthorized()) return null;
  return isValidAdminFastCode(getFastCode() || "") ? "admin" : "associate";
};
