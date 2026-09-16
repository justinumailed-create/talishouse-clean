"use client";

import {
  ADMIN_FAST_CODE,
  ADMIN_SESSION_COOKIE,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
  isElevatedAdminAccess,
} from "./admin-constants";

export { ADMIN_FAST_CODE, ADMIN_SESSION_COOKIE };

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
export const setAdminSession = (code: string = ADMIN_FAST_CODE) => {
  if (!isBrowser()) return;

  const sessionCode = normalizeFastCode(code);
  if (!isAuthorizedAdminFastCode(sessionCode)) return;

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

export const isValidAdminFastCode = (code: string): boolean => {
  return isAuthorizedAdminFastCode(code);
};

export const isAuthorized = (): boolean => {
  const code = getFastCode();
  return !!code && code.trim() !== "";
};

export const isSuperAdmin = (): boolean => {
  const account = getAdminAccountByFastCode(getFastCode());
  return isElevatedAdminAccess(account?.access);
};

export const getRole = (): "admin" | "associate" | null => {
  if (!isAuthorized()) return null;
  return isValidAdminFastCode(getFastCode() || "") ? "admin" : "associate";
};
